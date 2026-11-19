import {
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MS_PER_SECOND } from '@/common/constants/time.constants';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import { CircuitBreaker } from '@/common/utils/circuit-breaker';
import { SERVICE_NAME } from '@/common/enums/service-name.enum';
import { ENV_KEYS } from '@/config/env.constants';
import { FAILURE_MESSAGES } from '@/modules/service-failures/constants/service-failures.constants';
import { ServiceFailuresService } from '@/modules/service-failures/services/service-failures.service';
import {
  badResponseFailure,
  errorCodeOf,
  type Failure,
  type FetchFailureCode,
  fetchFailureOf,
  httpStatusFailure,
  isTimeoutError,
} from '@/modules/service-failures/utils/failure-message';
import {
  COORDINATE_SEPARATOR,
  OSRM_COOLDOWN_MS,
  OSRM_FAILURE_THRESHOLD,
  OSRM_NO_ROUTE_CODE,
  OSRM_OK_CODE,
  OSRM_REQUEST_TIMEOUT_MS,
  OSRM_ROUTE_NOT_FOUND_MESSAGE,
  OSRM_ROUTE_PATH,
  OSRM_SERVICE_PATH,
  OSRM_UNAVAILABLE_MESSAGE,
  POINT_SEPARATOR,
  TRAILING_SLASHES,
} from '../constants/osrm.constants';
import { osrmResponseSchema } from '../schemas/osrm-response.schema';
import type { OsrmAnswer, OsrmAnswerRoute, OsrmProfile } from '../types/osrm.types';

// The HTTP side of the routing service, shared by the times of the trips and the lines on the maps.
@Injectable()
export class OsrmClient {
  private readonly logger = new Logger(OsrmClient.name);
  private readonly baseUrl: string;
  // One for the whole app: pricing, assignment and the maps share the same routing service.
  private readonly breaker = new CircuitBreaker(OSRM_FAILURE_THRESHOLD, OSRM_COOLDOWN_MS);

  constructor(
    config: ConfigService,
    private readonly failures: ServiceFailuresService,
  ) {
    this.baseUrl = config.getOrThrow<string>(ENV_KEYS.OSRM_URL).replace(TRAILING_SLASHES, '');
  }

  // False while the breaker is open: a request now would fail at once anyway.
  isAvailable(): boolean {
    return !this.breaker.isOpen(Date.now());
  }

  // While the breaker is open the request is not made and nothing is logged. Only an unavailable
  // service or an unexpected answer (503) is a failure; "no route" (422) is a normal answer.
  async call<T>(request: () => Promise<T>): Promise<T> {
    if (!this.isAvailable()) {
      throw new ServiceUnavailableException(OSRM_UNAVAILABLE_MESSAGE);
    }

    try {
      const result = await request();
      this.onAnswer();

      return result;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        this.onFailure();
      } else {
        this.onAnswer();
      }

      throw error;
    }
  }

  // The first route through the points, with the parts the query asked for.
  async requestRoute(
    points: readonly GeoPoint[],
    profile: OsrmProfile,
    query: string,
  ): Promise<OsrmAnswerRoute> {
    return (await this.requestRouteWithWaypoints(points, profile, query)).route;
  }

  // The same route and the points as OSRM snapped them to the roads, in the order asked for.
  async requestRouteWithWaypoints(
    points: readonly GeoPoint[],
    profile: OsrmProfile,
    query: string,
  ): Promise<{ route: OsrmAnswerRoute; waypoints: NonNullable<OsrmAnswer['waypoints']> }> {
    const payload = await this.fetchPayload(this.buildUrl(points, profile, query));
    const parsed = osrmResponseSchema.safeParse(payload);

    if (!parsed.success) {
      this.logger.error(`Unexpected OSRM response: ${parsed.error.message}`);
      throw this.failed(badResponseFailure(FAILURE_MESSAGES.BAD_SHAPE));
    }

    const { code, routes, waypoints } = parsed.data;

    if (code === OSRM_NO_ROUTE_CODE) {
      throw new UnprocessableEntityException(OSRM_ROUTE_NOT_FOUND_MESSAGE);
    }

    const [route] = routes ?? [];

    if (code !== OSRM_OK_CODE || !route) {
      this.logger.error(`OSRM returned no usable route, code: ${code}`);
      throw this.failed(badResponseFailure(FAILURE_MESSAGES.NO_ROUTE_DATA));
    }

    return { route, waypoints: waypoints ?? [] };
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

  private buildUrl(points: readonly GeoPoint[], profile: OsrmProfile, query: string): string {
    // OSRM expects longitude first.
    const path = points
      .map((point) => `${point.longitude}${COORDINATE_SEPARATOR}${point.latitude}`)
      .join(POINT_SEPARATOR);

    return `${this.baseUrl}/${OSRM_SERVICE_PATH[profile]}/${OSRM_ROUTE_PATH}/${path}?${query}`;
  }

  // The body is read even for non-2xx answers, because OSRM reports "NoRoute" with an error status.
  private async fetchPayload(url: string): Promise<unknown> {
    let response: Response;

    try {
      response = await fetch(url, { signal: AbortSignal.timeout(OSRM_REQUEST_TIMEOUT_MS) });
    } catch (error) {
      this.logger.error(`OSRM request failed: ${errorCodeOf(error)}`);
      throw this.failed(fetchFailureOf(error, OSRM_REQUEST_TIMEOUT_MS));
    }

    if (response.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`OSRM answered with status ${response.status}`);
      throw this.failed(httpStatusFailure(response.status));
    }

    try {
      return await response.json();
    } catch (error) {
      this.logger.error(`OSRM answer could not be read: ${errorCodeOf(error)}`);
      throw this.failed(
        isTimeoutError(error)
          ? fetchFailureOf(error, OSRM_REQUEST_TIMEOUT_MS)
          : badResponseFailure(FAILURE_MESSAGES.NOT_JSON),
      );
    }
  }

  private failed(failure: Failure<FetchFailureCode>): ServiceUnavailableException {
    void this.failures.record(SERVICE_NAME.OSRM, failure.code, failure.message);

    return new ServiceUnavailableException(OSRM_UNAVAILABLE_MESSAGE);
  }
}
