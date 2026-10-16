import { Injectable } from '@nestjs/common';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import { METERS_PER_KM, OSRM_PROFILE, OSRM_QUERY } from '../constants/osrm.constants';
import type { OsrmProfile, OsrmRoute } from '../types/osrm.types';
import { OsrmClient } from './osrm-client.service';

// The distance and the time of a trip, for the price and for choosing a courier.
@Injectable()
export class OsrmService {
  constructor(private readonly client: OsrmClient) {}

  // False while the breaker is open: a request now would fail at once anyway.
  isAvailable(): boolean {
    return this.client.isAvailable();
  }

  // Throws 503 when the service is unavailable or the breaker is open, 422 when there is no route.
  getRoute(
    from: GeoPoint,
    to: GeoPoint,
    profile: OsrmProfile = OSRM_PROFILE.CAR,
  ): Promise<OsrmRoute> {
    return this.client.call(async () => {
      const route = await this.client.requestRoute([from, to], profile, OSRM_QUERY);

      return { distanceKm: route.distance / METERS_PER_KM, durationSec: route.duration };
    });
  }
}
