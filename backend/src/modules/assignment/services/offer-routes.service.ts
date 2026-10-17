import { Injectable } from '@nestjs/common';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import { OsrmService } from '../../../integrations/osrm/services/osrm.service';
import type { OsrmProfile, OsrmRoute } from '../../../integrations/osrm/types/osrm.types';
import { VEHICLE_ROUTING_PROFILE } from '../constants/assignment.constants';
import type {
  CandidatePickup,
  CourierCandidate,
  DispatchOrder,
  OfferPlan,
} from '../types/assignment.types';

@Injectable()
export class OfferRoutesService {
  constructor(private readonly osrm: OsrmService) {}

  // The candidate who reaches the pickup point first, with the times of the whole trip, or null
  // when no route could be built.
  async plan(order: DispatchOrder, candidates: CourierCandidate[]): Promise<OfferPlan | null> {
    const pickups = await Promise.all(
      candidates.map((candidate) => this.toPickup(candidate, order.pickup)),
    );
    const fastest = pickups.reduce<CandidatePickup | null>(
      (best, current) => (current && (!best || current.etaSec < best.etaSec) ? current : best),
      null,
    );

    return fastest ? this.withDelivery(order, fastest) : null;
  }

  private async toPickup(
    candidate: CourierCandidate,
    pickup: GeoPoint,
  ): Promise<CandidatePickup | null> {
    const profile = VEHICLE_ROUTING_PROFILE[candidate.vehicleType];
    const route = await this.findRoute(candidate.position, pickup, profile);

    return route ? { candidate, etaSec: Math.ceil(route.durationSec) } : null;
  }

  private async withDelivery(
    order: DispatchOrder,
    fastest: CandidatePickup,
  ): Promise<OfferPlan | null> {
    const profile = VEHICLE_ROUTING_PROFILE[fastest.candidate.vehicleType];
    const route = await this.findRoute(order.pickup, order.delivery, profile);

    return route
      ? {
          courierProfileId: fastest.candidate.courierProfileId,
          pickupEtaSec: fastest.etaSec,
          totalEtaSec: fastest.etaSec + Math.ceil(route.durationSec),
        }
      : null;
  }

  // A failed route leaves the courier out of this round; it never stops the assignment. The routing
  // service has logged the failure itself, so nothing is logged here a second time.
  private async findRoute(
    from: GeoPoint,
    to: GeoPoint,
    profile: OsrmProfile,
  ): Promise<OsrmRoute | null> {
    let route: OsrmRoute | null = null;

    try {
      route = await this.osrm.getRoute(from, to, profile);
    } catch {
      route = null;
    }

    return route;
  }
}
