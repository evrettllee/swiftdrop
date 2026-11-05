import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { historyCondition, historyTotalsQuery } from './history-query';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;
const NO_PERIOD = { start: null, end: null };

function render(condition: ReturnType<typeof historyCondition>) {
  return historyTotalsQuery(db, condition).toSQL();
}

describe('historyCondition', () => {
  it('should keep to the finished orders of this courier', () => {
    const { sql, params } = render(historyCondition(7, NO_PERIOD, null));

    expect(sql).toContain('"courier_id" = $');
    expect(sql).toContain('"status" in (');
    expect(params).toEqual(expect.arrayContaining([7, 'delivered', 'cancelled']));
  });

  it('should match the number of the order exactly', () => {
    const { sql, params } = render(historyCondition(7, NO_PERIOD, { orderId: 48232 }));

    expect(sql).toContain('"order_id" = $');
    expect(params).toContain(48232);
  });

  it('should find nothing by a number no order can have', () => {
    expect(render(historyCondition(7, NO_PERIOD, { orderId: null })).sql).toContain('false');
  });

  it('should take the period by the moment the order finished', () => {
    const start = new Date('2026-10-19T21:00:00.000Z');
    const end = new Date('2026-10-26T21:00:00.000Z');
    const { sql } = render(historyCondition(7, { start, end }, null));

    expect(sql).toContain('"finished_at" >= $');
    expect(sql).toContain('"finished_at" < $');
  });
});

describe('historyTotalsQuery', () => {
  it('should count all the orders and only the delivered ones with their distance', () => {
    const { sql, params } = render(historyCondition(7, NO_PERIOD, null));

    expect(sql).toContain('count(*)');
    expect(sql).toContain('count(*) filter (where "orders"."status" = $1)');
    expect(sql).toContain(
      'round(coalesce(sum("distance_km") filter (where "orders"."status" = $2), 0), $3)',
    );
    expect(params.slice(0, 3)).toEqual(['delivered', 'delivered', 1]);
  });
});
