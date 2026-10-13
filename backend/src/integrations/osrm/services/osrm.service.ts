import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import { ENV_KEYS } from '../../../config/env.constants';
import {
  COORDINATE_SEPARATOR,
  METERS_PER_KM,
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
import type { OsrmProfile, OsrmRoute } from '../types/osrm.types';

const osrmResponseSchema = z.object({
  code: z.string(),
  routes: z.array(z.object({ distance: z.number(), duration: z.number() })).optional(),
});

@Injectable()
export class OsrmService {
  private readonly logger = new Logger(OsrmService.name);
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>(ENV_KEYS.OSRM_URL).replace(TRAILING_SLASHES, '');
  }

  async getRoute(
    from: GeoPoint,
    to: GeoPoint,
    profile: OsrmProfile = OSRM_PROFILE.CAR,
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
      this.logger.error(
        `OSRM request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(OSRM_UNAVAILABLE_MESSAGE);
    }
  }
}
