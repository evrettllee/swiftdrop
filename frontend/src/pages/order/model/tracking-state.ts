import {
  type ClientOrderRoute,
  ORDER_STATUS,
  type OrderStatus,
  ROUTE_SEGMENT_KIND,
} from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import { COURIER_LEG_TARGET, type CourierLeg } from '@/shared/realtime';

// Where the courier was last, as the backend stored it (updatedAt by its clock).
export type CourierPosition = GeoPoint & { updatedAt: Date };

// What the page knows of the order beyond its details: kept in step with the events of its room.
export type OrderTrackingState = {
  status: OrderStatus | null;
  estimatedDeliveryAt: Date | null;
  // When the courier reaches the pickup point; only while they go there.
  pickupEtaAt: Date | null;
  // The line of the courier to their next point.
  courierLeg: CourierLeg | null;
  courierPosition: CourierPosition | null;
  // When the position came to the page, by the clock of the page.
  positionReceivedAt: number | null;
  // No position came for a minute: the connection with the courier is lost.
  isPositionStale: boolean;
};

export const NO_TRACKING: OrderTrackingState = {
  status: null,
  estimatedDeliveryAt: null,
  pickupEtaAt: null,
  courierLeg: null,
  courierPosition: null,
  positionReceivedAt: null,
  isPositionStale: false,
};

// The order is over: no courier moves for it any more (FINISHED_STATUSES of the backend).
const FINISHED: readonly OrderStatus[] = [
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REJECTED,
];

export function isFinishedStatus(status: OrderStatus | null): boolean {
  return status !== null && FINISHED.includes(status);
}

// The point the courier goes to at the status, or null when they go nowhere for the order.
function legTargetOf(status: OrderStatus): CourierLeg['toPoint'] | null {
  if (status === ORDER_STATUS.COURIER_ASSIGNED) {
    return COURIER_LEG_TARGET.PICKUP;
  }

  return status === ORDER_STATUS.PICKED_UP || status === ORDER_STATUS.IN_TRANSIT
    ? COURIER_LEG_TARGET.DROPOFF
    : null;
}

// A new status keeps only what still holds for it: the line to the point the courier goes to now,
// the arrival at the pickup point before the pickup. A finished order keeps no courier at all.
export function withStatus(
  state: OrderTrackingState,
  status: OrderStatus,
  estimatedDeliveryAt: Date | null,
): OrderTrackingState {
  if (isFinishedStatus(status)) {
    return { ...NO_TRACKING, status, estimatedDeliveryAt };
  }

  const isLegKept = state.courierLeg !== null && legTargetOf(status) === state.courierLeg.toPoint;

  return {
    ...state,
    status,
    estimatedDeliveryAt,
    pickupEtaAt: status === ORDER_STATUS.COURIER_ASSIGNED ? state.pickupEtaAt : null,
    courierLeg: isLegKept ? state.courierLeg : null,
  };
}

const LEG_TARGET_OF_SEGMENT = {
  [ROUTE_SEGMENT_KIND.TO_PICKUP]: COURIER_LEG_TARGET.PICKUP,
  [ROUTE_SEGMENT_KIND.TO_DROPOFF]: COURIER_LEG_TARGET.DROPOFF,
} as const;

// The line of the courier as the route of the order gave it, when it has one.
export function courierLegOfRoute({ segments }: ClientOrderRoute): CourierLeg | null {
  for (const { kind, geometry } of segments) {
    if (kind !== ROUTE_SEGMENT_KIND.PICKUP_TO_DROPOFF && geometry !== null) {
      return { geometry, toPoint: LEG_TARGET_OF_SEGMENT[kind] };
    }
  }

  return null;
}
