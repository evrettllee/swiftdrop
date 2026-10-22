import { and, eq, inArray } from 'drizzle-orm';
import type { Database, Transaction } from '../../database/database.module';
import { courierProfiles, orders, users } from '../../database/schema';
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

export type OrderParticipantOptions = {
  // Inside a transaction: hold the order row FOR SHARE until the commit.
  lockOrder?: boolean;
};

// What an open socket learns when it asks for an order: whether its user takes part, and whether
// the account was blocked since the socket opened, known for any order, even a foreign one.
export type OrderAccess = {
  participant: OrderParticipant | null;
  actorBlocked: boolean;
};

// Only clients and couriers take part in orders; any other role gets null.
export function participantActor(role: RoleName, userId: number): OrderParticipantActor | null {
  return role === ROLE.CLIENT || role === ROLE.COURIER ? { role, userId } : null;
}

// The one check of who takes part in an order, for its room and its chat. One query by the
// primary keys: a foreign order and a missing one look and take the same (null).
// With `lockOrder` the order row is held FOR SHARE until the commit: a status change waits for
// it, and if the change came first the row is read as it is after it. Only the order row is
// locked; the courier profile is the nullable side of the join.
export async function orderParticipant(
  executor: Database | Transaction,
  orderId: number,
  actor: OrderParticipantActor,
  options: OrderParticipantOptions = {},
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
  const [row] = await (options.lockOrder ? query.for(ROW_LOCK_SHARE, { of: orders }) : query);

  return row
    ? {
        status: row.status,
        clientUserId: row.clientUserId,
        counterpartUserId: isClient ? row.courierUserId : row.clientUserId,
      }
    : null;
}

// The same check for an open socket, read from the user: the user row is always found, the order
// joins only when the user takes part in it, so the block is known for a foreign or a missing
// order too. One query by primary keys; a courier is matched through their profile by the unique
// index of its user. A user row that is gone counts as blocked.
export async function orderAccess(
  db: Database,
  orderId: number,
  actor: OrderParticipantActor,
): Promise<OrderAccess> {
  const isClient = actor.role === ROLE.CLIENT;
  const takesPart = isClient
    ? eq(orders.clientId, users.userId)
    : inArray(
        orders.courierId,
        db
          .select({ courierProfileId: courierProfiles.courierProfileId })
          .from(courierProfiles)
          .where(eq(courierProfiles.userId, actor.userId)),
      );
  const [row] = await db
    .select({
      actorBlocked: users.isBlocked,
      status: orders.status,
      clientUserId: orders.clientId,
      courierUserId: courierProfiles.userId,
    })
    .from(users)
    .leftJoin(orders, and(eq(orders.orderId, orderId), takesPart))
    .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
    .where(eq(users.userId, actor.userId))
    .limit(SINGLE_ROW_LIMIT);
  const participant =
    row?.status && row.clientUserId !== null
      ? {
          status: row.status,
          clientUserId: row.clientUserId,
          counterpartUserId: isClient ? row.courierUserId : row.clientUserId,
        }
      : null;

  return { participant, actorBlocked: row?.actorBlocked ?? true };
}
