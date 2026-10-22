import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { positionAgeMsSql } from '../../../common/database/position-age';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { courierProfiles, orders } from '../../../database/schema';
import { aliasOrderAddresses } from '../../orders/utils/order-address-columns';
import { ROUTE_SEGMENT_KIND } from '../../routing/constants/routing.constants';
import { RouteLinesService } from '../../routing/services/route-lines.service';
import type {
  RoutedOrder,
  RouteSegment,
  RouteSegmentKind,
} from '../../routing/types/routing.types';
import { nextPointPlan } from '../../routing/utils/segment-plans';
import { COURIER_LEG_TARGET } from '../../tracking/constants/tracking.constants';
import { OrderEtaService } from '../../tracking/services/order-eta.service';
import type { CourierLegTarget } from '../../tracking/types/tracking.types';
import { DELIVERIES_ERROR_MESSAGES } from '../constants/deliveries.constants';
import type { ClientOrderRoute } from '../types/deliveries.types';
import { toClientCourierPosition } from '../utils/courier-position';

// The segment of the map each line of the courier is drawn as.
const SEGMENT_OF_LEG: Record<CourierLegTarget, RouteSegmentKind> = {
  [COURIER_LEG_TARGET.PICKUP]: ROUTE_SEGMENT_KIND.TO_PICKUP,
  [COURIER_LEG_TARGET.DROPOFF]: ROUTE_SEGMENT_KIND.TO_DROPOFF,
};

@Injectable()
export class ClientOrderRouteService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly routes: RouteLinesService,
    private readonly eta: OrderEtaService,
  ) {}

  // The route of an order of the client and where its courier is; a foreign order looks the same as
  // a missing one. The age of the position is counted by the clock of the database that stored it.
  async find(clientId: number, orderId: number): Promise<ClientOrderRoute> {
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
        positionAgeMs: positionAgeMsSql(courierProfiles.locationUpdatedAt),
      })
      .from(orders)
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
      .where(and(eq(orders.orderId, orderId), eq(orders.clientId, clientId)))
      .limit(SINGLE_ROW_LIMIT);

    if (!order) {
      throw new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    const parcel = await this.routes.forClientParcel(order);
    const courierSegment = this.courierSegment(orderId, order);

    return {
      segments: courierSegment ? [...parcel.segments, courierSegment] : parcel.segments,
      courierPosition: toClientCourierPosition(order),
    };
  }

  // The way of the courier to the next point, as the last arrival estimate drew it. A line made for
  // another point (the status has just changed) is not shown.
  private courierSegment(orderId: number, order: RoutedOrder): RouteSegment | null {
    const next = nextPointPlan(order, null);

    if (next === null) {
      return null;
    }

    const leg = this.eta.courierLeg(orderId);
    const isForThisPoint = leg !== null && SEGMENT_OF_LEG[leg.toPoint] === next.kind;

    return { kind: next.kind, geometry: isForThisPoint ? leg.geometry : null };
  }
}
