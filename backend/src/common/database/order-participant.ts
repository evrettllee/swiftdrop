import { and, eq } from 'drizzle-orm';
import type { Database, Transaction } from '../../database/database.module';
import { courierProfiles, orders } from '../../database/schema';
import { ROW_LOCK_SHARE, SINGLE_ROW_LIMIT } from '../constants/database.constants';
import { ROLE, type RoleName } from '../enums/role.enum';
import type { OrderStatus } from '../enums/order-status.enum';

// The two sides of an order: its owner and its assigned courier, both as users.
export type OrderParticipantActor = {
  role: typeof ROLE.CLIENT | typeof ROLE.COURIER;
  userId: number;
};

export type OrderParticipant = {
  status: OrderStatus;
  // The owner of the order.
  clientUserId: number;
  // The user on the other side: the courier for the client (null before one is assigned), the
  // client for the courier.
  counterpartUserId: number | null;
};

// Only clients and couriers take part in orders; any other role gets null.
export function participantActor(role: RoleName, userId: number): OrderParticipantActor | null {
  return role === ROLE.CLIENT || role === ROLE.COURIER ? { role, userId } : null;
}

// The one check of who takes part in an order, for its room and its chat. One query by the
// primary keys: a foreign order and a missing one look and take the same (null).
// With `lockOrder` (inside a transaction) the order row is held FOR SHARE until the commit: a
// status change waits for it, and if the change came first the row is read as it is after it.
// Only the order row is locked; the courier profile is the nullable side of the join.
export async function orderParticipant(
  executor: Database | Transaction,
  orderId: number,
  actor: OrderParticipantActor,
  lockOrder = false,
): Promise<OrderParticipant | null> {
  const isClient = actor.role === ROLE.CLIENT;
  const query = executor
    .select({
      status: orders.status,
      clientUserId: orders.clientId,
      courierUserId: courierProfiles.userId,
    })
    .from(orders)
    .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
    .where(
      and(
        eq(orders.orderId, orderId),
        isClient ? eq(orders.clientId, actor.userId) : eq(courierProfiles.userId, actor.userId),
      ),
    )
    .limit(SINGLE_ROW_LIMIT);
  const [row] = await (lockOrder ? query.for(ROW_LOCK_SHARE, { of: orders }) : query);

  return row
    ? {
        status: row.status,
        clientUserId: row.clientUserId,
        counterpartUserId: isClient ? row.courierUserId : row.clientUserId,
      }
    : null;
}
