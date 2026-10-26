import { ORDER_STATUS } from '@/shared/api';
import type { StatusLineSource } from './status-line';

export function getStatusLineAnchorMs({
  order,
  tracking,
}: Omit<StatusLineSource, 'nowMs' | 'payment'>): number | null {
  if (tracking.isPositionStale) {
    return tracking.positionReceivedAt;
  }

  if (order.status === ORDER_STATUS.COURIER_ASSIGNED) {
    return tracking.pickupEtaAt?.getTime() ?? null;
  }

  if (order.status === ORDER_STATUS.PICKED_UP || order.status === ORDER_STATUS.IN_TRANSIT) {
    return (tracking.estimatedDeliveryAt ?? order.estimatedDeliveryAt)?.getTime() ?? null;
  }

  return null;
}
