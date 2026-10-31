import type { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { SORT_VALUE_KIND } from '@/common/constants/list.constants';
import { orders } from '@/database/schema';
import { isSortValueValid, keysetCondition, sortOrderBy, sortValueSql } from './list-sort';

const dialect = new PgDialect({ casing: 'snake_case' });
const CREATED_AT = { column: orders.createdAt, kind: SORT_VALUE_KIND.TIMESTAMP };
const PRICE = { column: orders.price, kind: SORT_VALUE_KIND.DECIMAL };
const ID = { column: orders.orderId, kind: SORT_VALUE_KIND.INTEGER };

function render(fragment: SQL) {
  return dialect.sqlToQuery(fragment);
}

describe('sortOrderBy', () => {
  it('should put the id last, in the same direction as the key', () => {
    const [first, second] = sortOrderBy(CREATED_AT, orders.orderId, {
      key: 'createdAt',
      direction: 'desc',
    }).map((part) => render(part).sql);

    expect(first).toBe('"orders"."created_at" desc');
    expect(second).toBe('"orders"."order_id" desc');
  });

  it('should keep the ascending direction for both', () => {
    const parts = sortOrderBy(PRICE, orders.orderId, { key: 'price', direction: 'asc' });

    expect(parts.map((part) => render(part).sql)).toEqual([
      '"orders"."price" asc',
      '"orders"."order_id" asc',
    ]);
  });

  it('should not repeat the id when the id is the key', () => {
    const parts = sortOrderBy(ID, orders.orderId, { key: 'id', direction: 'desc' });

    expect(parts.map((part) => render(part).sql)).toEqual(['"orders"."order_id" desc']);
  });
});

describe('keysetCondition', () => {
  it('should compare the pair of key and id below the last row when descending', () => {
    const query = render(
      keysetCondition(CREATED_AT, orders.orderId, 'desc', { value: '1793000000123456', id: 7 }),
    );

    expect(query.sql).toBe(
      `("orders"."created_at", "orders"."order_id") < ((timestamptz 'epoch' + $1::bigint * interval '1 microsecond'), $2::integer)`,
    );
    expect(query.params).toEqual(['1793000000123456', 7]);
  });

  it('should compare above the last row when ascending', () => {
    const query = render(keysetCondition(PRICE, orders.orderId, 'asc', { value: '12.50', id: 7 }));

    expect(query.sql).toBe('("orders"."price", "orders"."order_id") > ($1::numeric, $2::integer)');
  });

  it('should compare the id alone when the id is the key', () => {
    const query = render(keysetCondition(ID, orders.orderId, 'desc', { value: '7', id: 7 }));

    expect(query.sql).toBe('"orders"."order_id" < $1::integer');
  });
});

describe('sortValueSql', () => {
  it('should read a timestamp as whole microseconds and other keys as text', () => {
    expect(render(sortValueSql(CREATED_AT)).sql).toBe(
      '(extract(epoch from "orders"."created_at") * 1000000)::bigint::text',
    );
    expect(render(sortValueSql(PRICE)).sql).toBe('"orders"."price"::text');
  });
});

describe('isSortValueValid', () => {
  it.each([
    [SORT_VALUE_KIND.TIMESTAMP, '1793000000123456', true],
    [SORT_VALUE_KIND.TIMESTAMP, '2026-10-29', false],
    [SORT_VALUE_KIND.TIMESTAMP, '1'.repeat(18), false],
    [SORT_VALUE_KIND.DECIMAL, '12.50', true],
    [SORT_VALUE_KIND.DECIMAL, '12,50', false],
    [SORT_VALUE_KIND.DECIMAL, '1e5', false],
    [SORT_VALUE_KIND.INTEGER, '2147483647', true],
    [SORT_VALUE_KIND.INTEGER, '2147483648', false],
    [SORT_VALUE_KIND.INTEGER, '1; drop table orders', false],
  ])('should check a %s value %j: %s', (kind, value, valid) => {
    expect(isSortValueValid(kind, value)).toBe(valid);
  });
});
