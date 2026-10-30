import { count, eq, type SQL } from 'drizzle-orm';
import type { Database } from '@/database/database.module';
import { orders, packages } from '@/database/schema';

export async function countManagerOrders(db: Database, where: SQL | undefined): Promise<number> {
  const [row] = await db
    .select({ total: count() })
    .from(orders)
    .innerJoin(packages, eq(packages.orderId, orders.orderId))
    .where(where);

  return row?.total ?? 0;
}
