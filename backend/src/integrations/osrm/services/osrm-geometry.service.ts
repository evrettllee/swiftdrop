import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import {
  OSRM_GEOMETRY_QUERY,
  OSRM_UNAVAILABLE_MESSAGE,
  ROUTE_GEOMETRY_CACHE_MAX_ENTRIES,
  ROUTE_GEOMETRY_CACHE_TTL_MS,
} from '../constants/osrm.constants';
import type { OsrmProfile, OsrmRouteGeometry } from '../types/osrm.types';
import { routeGeometryKey } from '../utils/route-geometry-key';
import { TtlCache } from '../utils/ttl-cache';
import { OsrmClient } from './osrm-client.service';

// The lines of the routes along the roads, for the maps.
@Injectable()
export class OsrmGeometryService {
  private readonly logger = new Logger(OsrmGeometryService.name);
  private readonly cache = new TtlCache<OsrmRouteGeometry>(
    ROUTE_GEOMETRY_CACHE_TTL_MS,
    ROUTE_GEOMETRY_CACHE_MAX_ENTRIES,
  );

  constructor(private readonly client: OsrmClient) {}

  // The line through the points, or null when there is none to draw: the service is unavailable,
  // its breaker is open, the answer is broken or no route exists. A map without a line asks again
  // later, so only found lines are kept. The client has logged a failure itself.
  async getRouteGeometry(
    points: readonly GeoPoint[],
    profile: OsrmProfile,
  ): Promise<OsrmRouteGeometry | null> {
    const key = routeGeometryKey(profile, points);
    const cached = this.cache.get(key, Date.now());

    if (cached !== undefined) {
      return cached;
    }

    let found: OsrmRouteGeometry | null = null;

    try {
      found = await this.client.call(() => this.requestGeometry(points, profile));
      this.cache.set(key, found, Date.now());
    } catch {
      found = null;
    }

    return found;
  }

  private async requestGeometry(
    points: readonly GeoPoint[],
    profile: OsrmProfile,
  ): Promise<OsrmRouteGeometry> {
    const route = await this.client.requestRoute(points, profile, OSRM_GEOMETRY_QUERY);

    // Asked for and missing: the answer is broken, which counts as a failure of the service.
    if (route.geometry === undefined) {
      this.logger.error('OSRM returned a route without the geometry');
      throw new ServiceUnavailableException(OSRM_UNAVAILABLE_MESSAGE);
    }

    return { geometry: route.geometry, distanceM: route.distance, durationS: route.duration };
  }
}
