import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import { OSRM_GEOMETRY_QUERY, OSRM_UNAVAILABLE_MESSAGE } from '../constants/osrm.constants';
import type { OsrmProfile, OsrmTrip } from '../types/osrm.types';
import { polylineUntil } from '../utils/polyline';
import { OsrmClient } from './osrm-client.service';

// The index of the waypoint that ends the first leg: the second point of the trip.
const FIRST_LEG_END = 1;

// The trip of a courier through several points in one request: the whole time for the arrival
// estimate and the line of the first leg for the map. Nothing is cached: the callers ask rarely.
@Injectable()
export class OsrmTripService {
  private readonly logger = new Logger(OsrmTripService.name);

  constructor(private readonly client: OsrmClient) {}

  // False while the breaker is open: a request now would fail at once anyway.
  isAvailable(): boolean {
    return this.client.isAvailable();
  }

  // Null when there is no trip to give: the service is unavailable, its breaker is open, the
  // answer is broken or no route exists. The client has logged a failure itself.
  async getTrip(points: readonly GeoPoint[], profile: OsrmProfile): Promise<OsrmTrip | null> {
    let trip: OsrmTrip | null = null;

    try {
      trip = await this.client.call(() => this.requestTrip(points, profile));
    } catch {
      trip = null;
    }

    return trip;
  }

  private async requestTrip(points: readonly GeoPoint[], profile: OsrmProfile): Promise<OsrmTrip> {
    const { route, waypoints } = await this.client.requestRouteWithWaypoints(
      points,
      profile,
      OSRM_GEOMETRY_QUERY,
    );
    const legEnd = waypoints[FIRST_LEG_END]?.location;

    // Asked for and missing: the answer is broken, which counts as a failure of the service.
    if (route.geometry === undefined || legEnd === undefined) {
      this.logger.error('OSRM returned a trip without the geometry or the waypoints');
      throw new ServiceUnavailableException(OSRM_UNAVAILABLE_MESSAGE);
    }

    const [longitude, latitude] = legEnd;
    const isOneLeg = points.length - 1 === FIRST_LEG_END;

    return {
      durationS: route.duration,
      firstLegGeometry: isOneLeg
        ? route.geometry
        : polylineUntil(route.geometry, { latitude, longitude }),
    };
  }
}
