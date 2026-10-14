import { and, eq, inArray } from 'drizzle-orm';
import type { Database, Transaction } from '../../database/database.module';
import { orders, orderStatusHistory } from '../../database/schema';
import type { OrderStatus } from '../enums/order-status.enum';

// Columns that change together with the status, for example the courier who took the order.
export type OrderTransitionChanges = Partial<
  Pick<typeof orders.$inferInsert, 'courierId' | 'otpCode' | 'otpFailedAttempts' | 'otpLockedUntil'>
>;

export type OrderStatusTransition = {
  orderId: number;
  // The status the order must be in now, or the list of such statuses.
  from: OrderStatus | readonly OrderStatus[];
  to: OrderStatus;
  // The user who made the change, null when the system made it.
  changedBy: number | null;
  // Limits the change to an order of this client.
  clientId?: number;
  // Limits the change to an order of this courier.
  courierId?: number;
  changes?: OrderTransitionChanges;
};

// Moves an order to a new status and writes the change to its history. The current status is
// checked in the UPDATE itself, so a change that happens in between is never overwritten. Returns
// the order, or nothing when its status or its owner did not allow the change.
export async function transitionOrderStatus(
  executor: Database | Transaction,
  transition: OrderStatusTransition,
): Promise<{ orderId: number } | undefined> {
  const { orderId, from, to, changedBy, clientId, courierId, changes } = transition;
  const [updated] = await executor
    .update(orders)
    .set({ ...changes, status: to })
    .where(
      and(
        eq(orders.orderId, orderId),
        clientId === undefined ? undefined : eq(orders.clientId, clientId),
        courierId === undefined ? undefined : eq(orders.courierId, courierId),
        typeof from === 'string' ? eq(orders.status, from) : inArray(orders.status, [...from]),
      ),
    )
    .returning({ orderId: orders.orderId });

  if (updated) {
    await executor.insert(orderStatusHistory).values({ orderId, status: to, changedBy });
  }

  return updated;
}
