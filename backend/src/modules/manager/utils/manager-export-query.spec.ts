import { drizzle } from 'drizzle-orm/node-postgres';
import { sortOrderBy } from '@/common/database/list-sort';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { managerExportQuery } from './manager-export-query';
import { MANAGER_ORDERS_SORT } from './manager-orders-sort';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;
const ORDER_BY = sortOrderBy(MANAGER_ORDERS_SORT.whitelist.price, MANAGER_ORDERS_SORT.idColumn, {
  key: 'price',
  direction: 'asc',
});

describe('managerExportQuery', () => {
  it('should not read any phone without the phones', () => {
    const { sql } = managerExportQuery(db, undefined, ORDER_BY, false).toSQL();

    expect(sql).not.toContain('phone');
  });

  it('should read the phones of the client and the courier on request', () => {
    const { sql } = managerExportQuery(db, undefined, ORDER_BY, true).toSQL();

    expect(sql).toContain('"client_user"."phone"');
    expect(sql).toContain('"courier_user"."phone"');
  });

  it('should order as the list does, with the id last and no limit', () => {
    const { sql } = managerExportQuery(db, undefined, ORDER_BY, false).toSQL();

    expect(sql).toMatch(/order by "orders"\."price" asc, "orders"\."order_id" asc$/);
  });
});
