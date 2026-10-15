import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MS_PER_SECOND } from '../../../common/constants/time.constants';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import { CircuitBreaker } from '../../../common/utils/circuit-breaker';
import { describeError } from '../../../common/utils/describe-error';
import { ENV_KEYS } from '../../../config/env.constants';
import {
  COORDINATE_SEPARATOR,
  METERS_PER_KM,
  OSRM_COOLDOWN_MS,
  OSRM_FAILURE_THRESHOLD,
  OSRM_NO_ROUTE_CODE,
  OSRM_OK_CODE,
  OSRM_PROFILE,
  OSRM_QUERY,
  OSRM_REQUEST_TIMEOUT_MS,
  OSRM_ROUTE_NOT_FOUND_MESSAGE,
  OSRM_ROUTE_PATH,
  OSRM_SERVICE_PATH,
  OSRM_UNAVAILABLE_MESSAGE,
  POINT_SEPARATOR,
  TRAILING_SLASHES,
} from '../constants/osrm.constants';
import { osrmResponseSchema } from '../schemas/osrm-response.schema';
import type { OsrmProfile, OsrmRoute } from '../types/osrm.types';

@Injectable()
export class OsrmService {
  private readonly logger = new Logger(OsrmService.name);
  private readonly baseUrl: string;
  // One for the whole app: pricing and assignment share the same routing service.
  private readonly breaker = new CircuitBreaker(OSRM_FAILURE_THRESHOLD, OSRM_COOLDOWN_MS);

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>(ENV_KEYS.OSRM_URL).replace(TRAILING_SLASHES, '');
  }

  // False while the breaker is open: a request now would fail at once anyway.
  isAvailable(): boolean {
    return !this.breaker.isOpen(Date.now());
  }

  // While the breaker is open the request is not made and nothing is logged. Only an unavailable
  // service or an unexpected answer (503) is a failure; "no route" (422) is a normal answer.
  async getRoute(
    from: GeoPoint,
    to: GeoPoint,
    profile: OsrmProfile = OSRM_PROFILE.CAR,
  ): Promise<OsrmRoute> {
    if (!this.isAvailable()) {
      throw new ServiceUnavailableException(OSRM_UNAVAILABLE_MESSAGE);
    }

    try {
      const route = await this.requestRoute(from, to, profile);
      this.onAnswer();

      return route;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        this.onFailure();
      } else {
        this.onAnswer();
      }

      throw error;
    }
  }

  private onAnswer(): void {
    if (this.breaker.recordSuccess()) {
      this.logger.log('OSRM answers again, routing resumed');
    }
  }

  private onFailure(): void {
    if (this.breaker.recordFailure(Date.now())) {
      this.logger.warn(
        `OSRM failed ${OSRM_FAILURE_THRESHOLD} times in a row, ` +
          `requests paused for ${OSRM_COOLDOWN_MS / MS_PER_SECOND} s`,
      );
    }
  }

  private async requestRoute(
    from: GeoPoint,
    to: GeoPoint,
    profile: OsrmProfile,
  ): Promise<OsrmRoute> {
    const payload = await this.fetchPayload(this.buildUrl(from, to, profile));
    const parsed = osrmResponseSchema.safeParse(payload);

    if (!parsed.success) {
      this.logger.error(`Unexpected OSRM response: ${parsed.error.message}`);
      throw new ServiceUnavailableException(OSRM_UNAVAILABLE_MESSAGE);
    }

    const { code, routes } = parsed.data;

    if (code === OSRM_NO_ROUTE_CODE) {
      throw new UnprocessableEntityException(OSRM_ROUTE_NOT_FOUND_MESSAGE);
    }

    const [route] = routes ?? [];

    if (code !== OSRM_OK_CODE || !route) {
      this.logger.error(`OSRM returned no usable route, code: ${code}`);
      throw new ServiceUnavailableException(OSRM_UNAVAILABLE_MESSAGE);
    }

    return { distanceKm: route.distance / METERS_PER_KM, durationSec: route.duration };
  }

  private buildUrl(from: GeoPoint, to: GeoPoint, profile: OsrmProfile): string {
    // OSRM expects longitude first.
    const points = [from, to]
      .map((point) => `${point.longitude}${COORDINATE_SEPARATOR}${point.latitude}`)
      .join(POINT_SEPARATOR);

    return `${this.baseUrl}/${OSRM_SERVICE_PATH[profile]}/${OSRM_ROUTE_PATH}/${points}?${OSRM_QUERY}`;
  }

  // The body is read even for non-2xx answers, because OSRM reports "NoRoute" with an error status.
  private async fetchPayload(url: string): Promise<unknown> {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(OSRM_REQUEST_TIMEOUT_MS) });

      return await response.json();
    } catch (error) {
      this.logger.error(`OSRM request failed: ${describeError(error)}`);
      throw new ServiceUnavailableException(OSRM_UNAVAILABLE_MESSAGE);
    }
  }
}
