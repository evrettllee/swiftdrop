import { drizzle } from 'drizzle-orm/node-postgres';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { courierWasOnOrder } from './courier-order-involvement';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;
const dialect = new PgDialect({ casing: 'snake_case' });

describe('courierWasOnOrder', () => {
  it('should match the current courier, an accepted offer or a history row of the courier', () => {
    const { sql, params } = dialect.sqlToQuery(courierWasOnOrder(db, 8));

    expect(sql).toContain(
      '"orders"."courier_id" in (select "courier_profile_id" from "courier_profiles" where "courier_profiles"."user_id" = $1)',
    );
    expect(sql).toContain('"order_offers"."order_id" = "orders"."order_id"');
    expect(sql).toContain('"order_offers"."status" = $2');
    expect(sql).toContain(
      '"order_status_history"."order_id" = "orders"."order_id" and "order_status_history"."changed_by" = $',
    );
    expect(params).toEqual([8, 'accepted', 8, 8]);
  });
});
