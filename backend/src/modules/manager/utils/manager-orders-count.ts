import { count, type SQL } from 'drizzle-orm';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';

export async function countManagerOrders(db: Database, where: SQL | undefined): Promise<number> {
  const [row] = await db.select({ total: count() }).from(orders).where(where);

  return row?.total ?? 0;
}
