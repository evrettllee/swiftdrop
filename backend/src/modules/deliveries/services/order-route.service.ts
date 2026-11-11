import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, type SQL } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { positionAgeMsSql } from '@/common/database/position-age';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, vehicles } from '@/database/schema';
import { aliasOrderAddresses } from '@/modules/orders/utils/order-address-columns';
import { ROUTE_SEGMENT_KIND } from '@/modules/routing/constants/routing.constants';
import { RouteLinesService } from '@/modules/routing/services/route-lines.service';
import type {
  RoutedOrder,
  RouteSegment,
  RouteSegmentKind,
} from '@/modules/routing/types/routing.types';
import { nextPointPlan } from '@/modules/routing/utils/segment-plans';
import { COURIER_LEG_TARGET } from '@/modules/tracking/constants/tracking.constants';
import { OrderEtaService } from '@/modules/tracking/services/order-eta.service';
import type { CourierLegTarget } from '@/modules/tracking/types/tracking.types';
import { DELIVERIES_ERROR_MESSAGES } from '../constants/deliveries.constants';
import type { ClientOrderRoute } from '../types/deliveries.types';
import { toClientCourierPosition } from '../utils/courier-position';

// The segment of the map each line of the courier is drawn as.
const SEGMENT_OF_LEG: Record<CourierLegTarget, RouteSegmentKind> = {
  [COURIER_LEG_TARGET.PICKUP]: ROUTE_SEGMENT_KIND.TO_PICKUP,
  [COURIER_LEG_TARGET.DROPOFF]: ROUTE_SEGMENT_KIND.TO_DROPOFF,
};

@Injectable()
export class OrderRouteService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly routes: RouteLinesService,
    private readonly eta: OrderEtaService,
  ) {}

  findForClient(clientId: number, orderId: number): Promise<ClientOrderRoute> {
    return this.find(orderId, eq(orders.clientId, clientId));
  }

  findForStaff(orderId: number): Promise<ClientOrderRoute> {
    return this.find(orderId, undefined);
  }

  // The route of an order and where its courier is, in one query with the vehicle of the courier for
  // the profile of the parcel line; for a client, a foreign order looks the same as a missing one. The
  // age of the position is counted by the clock of the database that stored it.
  private async find(orderId: number, owner: SQL | undefined): Promise<ClientOrderRoute> {
    const { pickup, delivery } = aliasOrderAddresses();
    const [order] = await this.db
      .select({
        status: orders.status,
        courierId: orders.courierId,
        pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
        delivery: { latitude: delivery.latitude, longitude: delivery.longitude },
        currentLat: courierProfiles.currentLat,
        currentLng: courierProfiles.currentLng,
        locationUpdatedAt: courierProfiles.locationUpdatedAt,
        vehicleType: vehicles.type,
        positionAgeMs: positionAgeMsSql(courierProfiles.locationUpdatedAt),
      })
      .from(orders)
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
      .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
      .where(and(eq(orders.orderId, orderId), owner))
      .limit(SINGLE_ROW_LIMIT);

    if (!order) {
      throw new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    const parcel = await this.routes.forClientParcel(order);
    const courier = this.courierWay(orderId, order);

    return {
      segments: courier ? [...parcel.segments, courier.segment] : parcel.segments,
      courierPosition: toClientCourierPosition(order),
      pickupEtaAt: courier?.pickupEtaAt ?? null,
    };
  }

  // The way of the courier to the next point and their arrival at the pickup point, as the last
  // arrival estimate made them. What was made for another point (the status has just changed) is
  // not shown.
  private courierWay(
    orderId: number,
    order: RoutedOrder,
  ): { segment: RouteSegment; pickupEtaAt: string | null } | null {
    const next = nextPointPlan(order, null);

    if (next === null) {
      return null;
    }

    const leg = this.eta.courierLeg(orderId);
    const isForThisPoint = leg !== null && SEGMENT_OF_LEG[leg.toPoint] === next.kind;

    return {
      segment: { kind: next.kind, geometry: isForThisPoint ? leg.geometry : null },
      pickupEtaAt: isForThisPoint ? this.eta.pickupEtaAt(orderId) : null,
    };
  }
}
