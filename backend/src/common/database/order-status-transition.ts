import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Database, Transaction } from '@/database/database.module';
import { orders, orderStatusHistory } from '@/database/schema';
import { ORDER_FINISHED_STATUSES } from '@/common/constants/orders.constants';
import type { OrderStatus } from '@/common/enums/order-status.enum';

const finishedStatuses = new Set<OrderStatus>(ORDER_FINISHED_STATUSES);

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

// A status an order got, as it is right after the change.
export type OrderStatusChange = {
  orderId: number;
  status: OrderStatus;
  estimatedDeliveryAt: Date | null;
};

// A transaction that keeps the status changes made in it, to announce them once it commits. Only
// runOrderTransaction() makes one, so a status cannot change without being announced.
export type OrderTransaction = {
  readonly tx: Transaction;
  readonly statusChanges: OrderStatusChange[];
};

// Runs the work in a transaction and hands its status changes, in the order they were made, to
// `publish` after the commit. A rolled back transaction publishes nothing. Savepoints (nested
// transactions) are not supported: a change rolled back to one would still be published.
export async function runOrderTransaction<T>(
  db: Database,
  work: (orderTx: OrderTransaction) => Promise<T>,
  publish: (changes: readonly OrderStatusChange[]) => void,
): Promise<T> {
  const statusChanges: OrderStatusChange[] = [];
  const result = await db.transaction((tx) => work({ tx, statusChanges }));

  publish(statusChanges);

  return result;
}

// Moves an order to a new status and writes the change to its history. The current status is
// checked in the UPDATE itself, so a change that happens in between is never overwritten. Returns
// the order, or nothing when its status or its owner did not allow the change. A made change is
// kept in the transaction to be announced after the commit.
export async function transitionOrderStatus(
  orderTx: OrderTransaction,
  transition: OrderStatusTransition,
): Promise<{ orderId: number } | undefined> {
  const { orderId, from, to, changedBy, clientId, courierId, changes } = transition;
  const finishedAt = finishedStatuses.has(to) ? sql`now()` : undefined;
  const [updated] = await orderTx.tx
    .update(orders)
    .set({ ...changes, status: to, ...(finishedAt && { finishedAt }) })
    .where(
      and(
        eq(orders.orderId, orderId),
        clientId === undefined ? undefined : eq(orders.clientId, clientId),
        courierId === undefined ? undefined : eq(orders.courierId, courierId),
        typeof from === 'string' ? eq(orders.status, from) : inArray(orders.status, [...from]),
      ),
    )
    .returning({
      orderId: orders.orderId,
      status: orders.status,
      estimatedDeliveryAt: orders.estimatedDeliveryAt,
    });

  if (updated) {
    await orderTx.tx.insert(orderStatusHistory).values({ orderId, status: to, changedBy });
    orderTx.statusChanges.push(updated);
  }

  return updated ? { orderId: updated.orderId } : undefined;
}
