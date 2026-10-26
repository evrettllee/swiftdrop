import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { ORDER_CANCELLED_BY } from '../constants/orders.constants';
import type { OrderCancelledBy, OrderHistoryRow, OrderHistoryView } from '../types/orders.types';

function toCancelledBy(
  rows: readonly OrderHistoryRow[],
  clientId: number,
): OrderCancelledBy | null {
  const cancellation = rows.findLast((row) => row.status === ORDER_STATUS.CANCELLED);

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
  return {
    history: rows.map(({ status, changedAt }) => ({ status, changedAt })),
    cancelledBy: toCancelledBy(rows, clientId),
  };
}
