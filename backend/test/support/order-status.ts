import { ORDER_FINISHED_STATUSES } from '@/common/constants/orders.constants';
import type { OrderStatus } from '@/common/enums/order-status.enum';

const finishedStatuses = new Set<OrderStatus>(ORDER_FINISHED_STATUSES);

export function statusChange(
  status: OrderStatus,
  at: Date = new Date(),
): { status: OrderStatus; finishedAt: Date | null } {
  return { status, finishedAt: finishedStatuses.has(status) ? at : null };
}
