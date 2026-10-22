import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import type { GeoPoint } from '../../../common/schemas/geo-point.schema';
import { ROUTE_SEGMENT_KIND } from '../constants/routing.constants';
import type { RoutedOrder, SegmentPlan } from '../types/routing.types';

// The way of the courier to the point they go to now: the pickup point until the parcel is taken,
// the recipient after it. Null when the order is not with the courier any more.
export function nextPointPlan(order: RoutedOrder, position: GeoPoint | null): SegmentPlan | null {
  let plan: SegmentPlan | null = null;

  if (order.status === ORDER_STATUS.COURIER_ASSIGNED) {
    plan = { kind: ROUTE_SEGMENT_KIND.TO_PICKUP, from: position, to: order.pickup };
  } else if (order.status === ORDER_STATUS.PICKED_UP || order.status === ORDER_STATUS.IN_TRANSIT) {
    plan = { kind: ROUTE_SEGMENT_KIND.TO_DROPOFF, from: position, to: order.delivery };
  }

  return plan;
}

// The trip of the parcel from the pickup point to the recipient.
export function parcelPlan(order: Pick<RoutedOrder, 'pickup' | 'delivery'>): SegmentPlan {
  return { kind: ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF, from: order.pickup, to: order.delivery };
}

// The order of the courier: to the pickup point and on to the recipient, then to the recipient only.
export function courierOrderPlans(order: RoutedOrder, position: GeoPoint | null): SegmentPlan[] {
  const next = nextPointPlan(order, position);
  const rest = order.status === ORDER_STATUS.COURIER_ASSIGNED ? [parcelPlan(order)] : [];

  return next === null ? rest : [next, ...rest];
}
