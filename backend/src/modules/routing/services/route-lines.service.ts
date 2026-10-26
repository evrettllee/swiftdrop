import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, vehicles } from '@/database/schema';
import { OsrmGeometryService } from '@/integrations/osrm/services/osrm-geometry.service';
import type { OsrmProfile } from '@/integrations/osrm/types/osrm.types';
import { DEFAULT_ROUTING_PROFILE, ROUTE_SEGMENT_KIND } from '../constants/routing.constants';
import type {
  RoutedOrder,
  RouteLines,
  RouteSegment,
  RoutingCourier,
  SegmentPlan,
} from '../types/routing.types';
import { routingProfileOf, toRoutingCourier } from '../utils/routing-courier';
import { courierOrderPlans, parcelPlan } from '../utils/segment-plans';

// An address of an order carries its street and house too; only the point goes to routing.
function toPoint({ latitude, longitude }: GeoPoint): GeoPoint {
  return { latitude, longitude };
}

// The lines of the maps along the roads. The position of a courier is always the last one the
// server has, never one from the request. Callers have checked that the order or the offer is theirs.
@Injectable()
export class RouteLinesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly geometry: OsrmGeometryService,
  ) {}

  // An offer: the way of the courier to the pickup point only, the delivery stays hidden until the
  // accept.
  async forOffer(courierProfileId: number, pickup: GeoPoint): Promise<RouteLines> {
    const courier = await this.findCourier(courierProfileId);
    const plan = { kind: ROUTE_SEGMENT_KIND.TO_PICKUP, from: courier.position, to: pickup };

    return this.build([plan], courier.profile);
  }

  async forCourierOrder(courierProfileId: number, order: RoutedOrder): Promise<RouteLines> {
    const courier = await this.findCourier(courierProfileId);

    return this.build(courierOrderPlans(order, courier.position), courier.profile);
  }

  // A finished order of the courier: the trip of the parcel only. The profile is of the vehicle the
  // courier has now: the vehicle of the moment of the order is not stored.
  async forHistoryOrder(
    courierProfileId: number,
    order: Pick<RoutedOrder, 'pickup' | 'delivery'>,
  ): Promise<RouteLines> {
    const courier = await this.findCourier(courierProfileId);

    return this.build([parcelPlan(order)], courier.profile);
  }

  // The trip of the parcel of a client order. The vehicle of the courier, read by the caller with
  // the order, sets the profile; the line of the courier comes with the arrival estimate instead.
  forClientParcel(
    order: Pick<RoutedOrder, 'pickup' | 'delivery'> & { vehicleType: VehicleType | null },
  ): Promise<RouteLines> {
    return this.build([parcelPlan(order)], routingProfileOf(order.vehicleType));
  }

  forPreview(pickup: GeoPoint, delivery: GeoPoint): Promise<RouteLines> {
    return this.build([parcelPlan({ pickup, delivery })], DEFAULT_ROUTING_PROFILE);
  }

  private async findCourier(courierProfileId: number): Promise<RoutingCourier> {
    const [row] = await this.db
      .select({
        currentLat: courierProfiles.currentLat,
        currentLng: courierProfiles.currentLng,
        locationUpdatedAt: courierProfiles.locationUpdatedAt,
        vehicleType: vehicles.type,
      })
      .from(courierProfiles)
      .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
      .where(eq(courierProfiles.courierProfileId, courierProfileId))
      .limit(SINGLE_ROW_LIMIT);

    return toRoutingCourier(row, new Date());
  }

  // The segments are asked for at once; one without a line does not hold back the others.
  private async build(plans: SegmentPlan[], profile: OsrmProfile): Promise<RouteLines> {
    const segments = await Promise.all(
      plans.map(async ({ kind, from, to }): Promise<RouteSegment> => {
        const route =
          from === null
            ? null
            : await this.geometry.getRouteGeometry([toPoint(from), toPoint(to)], profile);

        return { kind, geometry: route?.geometry ?? null };
      }),
    );

    return { segments };
  }
}
