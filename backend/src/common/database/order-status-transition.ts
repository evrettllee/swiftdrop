import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Database, Transaction } from '@/database/database.module';
import { orders, orderStatusHistory } from '@/database/schema';
import { ORDER_FINISHED_STATUSES } from '@/common/constants/orders.constants';
import type { OrderStatus } from '@/common/enums/order-status.enum';

const finishedStatuses = new Set<OrderStatus>(ORDER_FINISHED_STATUSES);

const changeColumns = {
  orderId: orders.orderId,
  status: orders.status,
  estimatedDeliveryAt: orders.estimatedDeliveryAt,
  statusChangedAt: orders.statusChangedAt,
  courierId: orders.courierId,
};

function statusIn(from: OrderStatus | readonly OrderStatus[]) {
  return typeof from === 'string' ? eq(orders.status, from) : inArray(orders.status, [...from]);
}

// Columns that change together with the status, for example the courier who took the order.
export type OrderTransitionChanges = Partial<
  Pick<
    typeof orders.$inferInsert,
    'courierId' | 'otpCode' | 'otpFailedAttempts' | 'otpLockedUntil' | 'assignmentRound'
  >
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
  comment?: string | null;
};

// A status an order got, as it is right after the change.
export type OrderStatusChange = {
  orderId: number;
  status: OrderStatus;
  estimatedDeliveryAt: Date | null;
  statusChangedAt: Date;
  courierId: number | null;
};

// A transaction that keeps the status changes made in it, to announce them once it commits. Only
// runOrderTransaction() makes one, so a status cannot change without being announced.
export type OrderTransaction = {
  readonly tx: Transaction;
  readonly statusChanges: OrderStatusChange[];
  readonly courierChanges: OrderCourierChanged[];
};

// Runs the work in a transaction and hands its status changes, in the order they were made, to
// `publish` after the commit. A rolled back transaction publishes nothing. Savepoints (nested
// transactions) are not supported: a change rolled back to one would still be published.
export async function runOrderTransaction<T>(
  db: Database,
  work: (orderTx: OrderTransaction) => Promise<T>,
  publish: (
    changes: readonly OrderStatusChange[],
    courierChanges: readonly OrderCourierChanged[],
  ) => void,
): Promise<T> {
  const statusChanges: OrderStatusChange[] = [];
  const courierChanges: OrderCourierChanged[] = [];
  const result = await db.transaction((tx) => work({ tx, statusChanges, courierChanges }));

  publish(statusChanges, courierChanges);

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
  const { orderId, from, to, changedBy, clientId, courierId, changes, comment } = transition;
  const finishedAt = finishedStatuses.has(to) ? sql`now()` : undefined;
  const [updated] = await orderTx.tx
    .update(orders)
    .set({ ...changes, status: to, statusChangedAt: sql`now()`, ...(finishedAt && { finishedAt }) })
    .where(
      and(
        eq(orders.orderId, orderId),
        clientId === undefined ? undefined : eq(orders.clientId, clientId),
        courierId === undefined ? undefined : eq(orders.courierId, courierId),
        statusIn(from),
      ),
    )
    .returning(changeColumns);

  if (updated) {
    await orderTx.tx.insert(orderStatusHistory).values({ orderId, status: to, changedBy, comment });
    orderTx.statusChanges.push(updated);
  }

  return updated ? { orderId: updated.orderId } : undefined;
}

export type OrderCourierChanged = OrderStatusChange & { previousCourierId: number | null };

export type OrderCourierChange = {
  orderId: number;
  from: readonly OrderStatus[];
  courierId: number;
  previousCourierId: number | null;
  changedBy: number;
  comment: string | null;
};

export async function changeOrderCourier(
  orderTx: OrderTransaction,
  change: OrderCourierChange,
): Promise<{ orderId: number } | undefined> {
  const { orderId, from, courierId, previousCourierId, changedBy, comment } = change;
  const [updated] = await orderTx.tx
    .update(orders)
    .set({ courierId })
    .where(and(eq(orders.orderId, orderId), statusIn(from)))
    .returning(changeColumns);

  if (updated) {
    await orderTx.tx
      .insert(orderStatusHistory)
      .values({ orderId, status: updated.status, changedBy, comment });
    orderTx.courierChanges.push({ ...updated, previousCourierId });
  }

  return updated ? { orderId: updated.orderId } : undefined;
}
