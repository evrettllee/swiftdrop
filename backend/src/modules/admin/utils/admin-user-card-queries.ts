import { and, count, desc, eq, gt, isNull, type SQL, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { courierActiveOrder } from '@/common/database/courier-active-order';
import type { AdminAction } from '@/common/enums/admin-action.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import type { Database } from '@/database/database.module';
import {
  addresses,
  adminActions,
  courierProfiles,
  orders,
  passwordResetTokens,
  roles,
  userOauthAccounts,
  users,
  vehicles,
} from '@/database/schema';
import { ADMIN_HISTORY_LIMIT, ADMIN_RECENT_ORDERS_LIMIT } from '../constants/admin-users.constants';
import { managedRole, USER_ROW_COLUMNS } from './admin-user-columns';

const actors = alias(users, 'actors');
const pickup = alias(addresses, 'pickup');
const delivery = alias(addresses, 'delivery');

export async function findCardUser(db: Database, userId: number) {
  const [row] = await db
    .select({
      ...USER_ROW_COLUMNS,
      courierProfileId: courierProfiles.courierProfileId,
      isAvailable: courierProfiles.isAvailable,
      vehicleType: vehicles.type,
    })
    .from(users)
    .innerJoin(roles, eq(roles.roleId, users.roleId))
    .leftJoin(courierProfiles, eq(courierProfiles.userId, users.userId))
    .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
    .where(and(eq(users.userId, userId), managedRole))
    .limit(SINGLE_ROW_LIMIT);

  return row ?? null;
}

export function findProviders(db: Database, userId: number) {
  return db
    .select({ provider: userOauthAccounts.provider })
    .from(userOauthAccounts)
    .where(eq(userOauthAccounts.userId, userId));
}

export async function findLatestAction(db: Database, userId: number, action: AdminAction) {
  const [row] = await db
    .select({
      at: adminActions.createdAt,
      details: adminActions.details,
      firstName: actors.firstName,
      lastName: actors.lastName,
    })
    .from(adminActions)
    .innerJoin(actors, eq(actors.userId, adminActions.actorId))
    .where(and(eq(adminActions.targetUserId, userId), eq(adminActions.action, action)))
    .orderBy(desc(adminActions.createdAt), desc(adminActions.adminActionId))
    .limit(SINGLE_ROW_LIMIT);

  return row ?? null;
}

export async function findActiveInvite(db: Database, userId: number) {
  const [row] = await db
    .select({ sentAt: passwordResetTokens.createdAt, expiresAt: passwordResetTokens.expiresAt })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        eq(passwordResetTokens.kind, TOKEN_KIND.INVITE),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, sql`now()`),
      ),
    )
    .orderBy(desc(passwordResetTokens.createdAt))
    .limit(SINGLE_ROW_LIMIT);

  return row ?? null;
}

export async function countOrders(db: Database, owner: SQL) {
  const [row] = await db
    .select({
      total: count(),
      delivered: sql<number>`(count(*) filter (where ${eq(orders.status, ORDER_STATUS.DELIVERED)}))::int`,
      cancelled: sql<number>`(count(*) filter (where ${eq(orders.status, ORDER_STATUS.CANCELLED)}))::int`,
    })
    .from(orders)
    .where(owner);

  return row;
}

export function findRecentOrders(db: Database, owner: SQL) {
  return db
    .select({
      orderId: orders.orderId,
      createdAt: orders.createdAt,
      status: orders.status,
      price: orders.price,
      fromStreet: pickup.street,
      fromHouse: pickup.house,
      toStreet: delivery.street,
      toHouse: delivery.house,
    })
    .from(orders)
    .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
    .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
    .where(owner)
    .orderBy(desc(orders.createdAt), desc(orders.orderId))
    .limit(ADMIN_RECENT_ORDERS_LIMIT);
}

export async function findActiveOrderId(db: Database, courierProfileId: number) {
  const [row] = await db
    .select({ orderId: orders.orderId })
    .from(orders)
    .where(courierActiveOrder(courierProfileId))
    .limit(SINGLE_ROW_LIMIT);

  return row?.orderId ?? null;
}

export function findHistory(db: Database, userId: number) {
  return db
    .select({
      action: adminActions.action,
      at: adminActions.createdAt,
      details: adminActions.details,
      firstName: actors.firstName,
      lastName: actors.lastName,
    })
    .from(adminActions)
    .innerJoin(actors, eq(actors.userId, adminActions.actorId))
    .where(eq(adminActions.targetUserId, userId))
    .orderBy(desc(adminActions.createdAt), desc(adminActions.adminActionId))
    .limit(ADMIN_HISTORY_LIMIT);
}
