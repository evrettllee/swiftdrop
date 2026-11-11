import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ORDER_CANCELLED_BY } from '../constants/orders.constants';
import type { OrderCancelledBy, OrderHistoryRow, OrderHistoryView } from '../types/orders.types';

function findCancellation(rows: readonly OrderHistoryRow[]): OrderHistoryRow | undefined {
  return rows.findLast((row) => row.status === ORDER_STATUS.CANCELLED);
}

function toCancelledBy(
  cancellation: OrderHistoryRow | undefined,
  clientId: number,
): OrderCancelledBy | null {
  if (!cancellation) {
    return null;
  }

  if (cancellation.changedBy === null) {
    return ORDER_CANCELLED_BY.SYSTEM;
  }

  return cancellation.changedBy === clientId ? ORDER_CANCELLED_BY.CLIENT : ORDER_CANCELLED_BY.STAFF;
}

export function toOrderHistory(
  rows: readonly OrderHistoryRow[],
  clientId: number,
): OrderHistoryView {
  const cancellation = findCancellation(rows);
  const cancelledBy = toCancelledBy(cancellation, clientId);

  return {
    history: rows.map(({ status, changedAt }) => ({ status, changedAt })),
    cancelledBy,
    cancelReason: cancelledBy === ORDER_CANCELLED_BY.STAFF ? (cancellation?.comment ?? null) : null,
  };
}
