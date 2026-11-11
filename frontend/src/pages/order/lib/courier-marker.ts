import type { OrderTrackingState } from '@/entities/order';
import { ORDER_STATUS, type OrderDetails } from '@/shared/api';
import { ORDER_COURIER_TEXTS } from '../config/tracking';
import { minutesUntil } from './minutes';

export function getCourierMarkerLabel(
  order: OrderDetails,
  tracking: OrderTrackingState,
  nowMs: number,
): string | null {
  if (tracking.isPositionStale) {
    return ORDER_COURIER_TEXTS.MARKER_OFFLINE;
  }

  const target =
    order.status === ORDER_STATUS.COURIER_ASSIGNED
      ? tracking.pickupEtaAt
      : (tracking.estimatedDeliveryAt ?? order.estimatedDeliveryAt);

  return target === null
    ? null
    : ORDER_COURIER_TEXTS.markerMinutes(minutesUntil(target.getTime(), nowMs));
}
