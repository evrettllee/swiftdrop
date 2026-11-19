import { and, eq, inArray } from 'drizzle-orm';
import { ROW_LOCK_UPDATE, SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { courierActiveOrder } from '@/common/database/courier-active-order';
import type { Transaction } from '@/database/database.module';
import { courierProfiles, orders } from '@/database/schema';
import { CLIENT_OPEN_ORDER_STATUSES } from '../constants/admin-access.constants';

export type LockedCourierProfile = { courierProfileId: number; isAvailable: boolean };

export async function lockCourierProfile(
  tx: Transaction,
  userId: number,
): Promise<LockedCourierProfile | null> {
  const [profile] = await tx
    .select({
      courierProfileId: courierProfiles.courierProfileId,
      isAvailable: courierProfiles.isAvailable,
    })
    .from(courierProfiles)
    .where(eq(courierProfiles.userId, userId))
    .limit(SINGLE_ROW_LIMIT)
    .for(ROW_LOCK_UPDATE);

  return profile ?? null;
}

export async function hasActiveCourierOrder(
  tx: Transaction,
  profile: LockedCourierProfile | null,
): Promise<boolean> {
  if (profile === null) {
    return false;
  }

  const [order] = await tx
    .select({ orderId: orders.orderId })
    .from(orders)
    .where(courierActiveOrder(profile.courierProfileId))
    .limit(SINGLE_ROW_LIMIT);

  return order !== undefined;
}

export async function hasOpenClientOrder(tx: Transaction, userId: number): Promise<boolean> {
  const [order] = await tx
    .select({ orderId: orders.orderId })
    .from(orders)
    .where(and(eq(orders.clientId, userId), inArray(orders.status, CLIENT_OPEN_ORDER_STATUSES)))
    .limit(SINGLE_ROW_LIMIT);

  return order !== undefined;
}
