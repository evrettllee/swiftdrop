import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { Database } from '@/database/database.module';
import { ManagerOrderCountsService } from './manager-order-counts.service';

const dialect = new PgDialect({ casing: 'snake_case' });
const ROW = { attention: 1, active: 2, awaitingPayment: 3, finished: 4, cancelled: 5, all: 15 };
const NO_FILTERS = {
  period: { start: null, end: null },
  courierId: null,
  payment: null,
  fragile: false,
  hasOpenTicket: false,
  search: null,
};

function fakeDatabase(result: unknown[]) {
  const calls = { select: [] as Record<string, SQL>[], where: [] as (SQL | undefined)[] };
  const chain = {
    from: () => chain,
    innerJoin: () => chain,
    where: (condition: SQL | undefined) => {
      calls.where.push(condition);

      return Promise.resolve(result);
    },
  };
  const db = {
    select: (fields: Record<string, SQL>) => {
      calls.select.push(fields);

      return chain;
    },
  } as unknown as Database;

  return { db, calls };
}

describe('ManagerOrderCountsService', () => {
  it('should count every tab in one query', async () => {
    const { db, calls } = fakeDatabase([ROW]);

    await expect(
      new ManagerOrderCountsService(db).count({ filters: NO_FILTERS, until: null }),
    ).resolves.toEqual(ROW);
    expect(calls.select).toHaveLength(1);
  });

  it('should count each group with a FILTER over its statuses', async () => {
    const { db, calls } = fakeDatabase([ROW]);

    await new ManagerOrderCountsService(db).count({ filters: NO_FILTERS, until: null });
    const fields = calls.select[0];
    const attention = dialect.sqlToQuery(fields.attention);
    const cancelled = dialect.sqlToQuery(fields.cancelled);

    expect(Object.keys(fields)).toEqual([
      'attention',
      'active',
      'awaitingPayment',
      'finished',
      'cancelled',
      'all',
    ]);
    expect(attention.sql).toBe('count(*) FILTER (WHERE "orders"."status" in ($1))');
    expect(attention.params).toEqual(['awaiting_manual_assignment']);
    expect(cancelled.params).toEqual(['cancelled', 'rejected']);
  });

  it('should keep to the bound of the list when it is given', async () => {
    const { db, calls } = fakeDatabase([ROW]);

    await new ManagerOrderCountsService(db).count({ filters: NO_FILTERS, until: 90 });
    const where = calls.where[0];

    expect(where && dialect.sqlToQuery(where)).toMatchObject({
      sql: '"orders"."order_id" <= $1',
      params: [90],
    });
  });

  it('should count nothing without a bound or filters', async () => {
    const { db, calls } = fakeDatabase([ROW]);

    await new ManagerOrderCountsService(db).count({ filters: NO_FILTERS, until: null });

    expect(calls.where[0]).toBeUndefined();
  });
});
