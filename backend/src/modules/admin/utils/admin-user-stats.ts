import { and, count, eq, inArray, sql } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import type { VehicleType } from '@/common/enums/vehicle-type.enum';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, vehicles } from '@/database/schema';

export type CourierPageStats = { vehicleType: VehicleType | null; deliveredCount: number };

export async function clientOrderCounts(
  db: Database,
  userIds: number[],
): Promise<Map<number, number>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({ userId: orders.clientId, total: count() })
    .from(orders)
    .where(inArray(orders.clientId, userIds))
    .groupBy(orders.clientId);

  return new Map(rows.map((row) => [row.userId, row.total]));
}

export async function courierPageStats(
  db: Database,
  userIds: number[],
): Promise<Map<number, CourierPageStats>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      userId: courierProfiles.userId,
      vehicleType: vehicles.type,
      deliveredCount: sql<number>`(
        select count(*)::int from ${orders}
        where ${and(
          eq(orders.courierId, courierProfiles.courierProfileId),
          eq(orders.status, ORDER_STATUS.DELIVERED),
        )}
      )`,
    })
    .from(courierProfiles)
    .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
    .where(inArray(courierProfiles.userId, userIds));

  return new Map(
    rows.map((row) => [
      row.userId,
      { vehicleType: row.vehicleType, deliveredCount: row.deliveredCount },
    ]),
  );
}
