import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { clientOrderSearchCondition, parseClientOrderSearch } from './order-search';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;

function render(query: string) {
  return db
    .select({ orderId: schema.orders.orderId })
    .from(schema.orders)
    .where(clientOrderSearchCondition(db, parseClientOrderSearch(query)))
    .toSQL();
}

describe('parseClientOrderSearch', () => {
  it.each([
    ['48232', 48232],
    ['0048232', 48232],
  ])('should read %j as the number of an order', (query, orderId) => {
    expect(parseClientOrderSearch(query)).toEqual({ kind: 'number', orderId });
  });

  it.each(['0', '2147483648', '99999999999999999999'])(
    'should find no order by the number %j',
    (query) => {
      expect(parseClientOrderSearch(query)).toEqual({ kind: 'number', orderId: null });
    },
  );

  it.each([
    ['Свердлова', '%Свердлова%'],
    ['Свердлова, 13а', '%Свердлова 13а%'],
    ['№48232', '%№48232%'],
    ['50%_off', '%50\\%\\_off%'],
  ])('should read %j as the words of an address', (query, pattern) => {
    expect(parseClientOrderSearch(query)).toEqual({ kind: 'text', pattern });
  });
});

describe('clientOrderSearchCondition', () => {
  it('should add nothing without a search', () => {
    expect(clientOrderSearchCondition(db, null)).toBeUndefined();
  });

  it('should match the number of the order exactly', () => {
    const { sql, params } = render('48232');

    expect(sql).toContain('"orders"."order_id" = $1');
    expect(params).toEqual([48232]);
  });

  it('should find nothing by a number that no order can have', () => {
    expect(render('0').sql).toContain('false');
  });

  it('should look at the street and the house of the pickup and the delivery of this order', () => {
    const { sql, params } = render('Свердлова 13');

    expect(sql).toContain('exists (select');
    expect(sql).toContain('"search_address"."address_id" = "orders"."pickup_address_id"');
    expect(sql).toContain('"search_address"."address_id" = "orders"."delivery_address_id"');
    expect(sql).toContain('"search_address"."street" || $1 || "search_address"."house" ilike $2');
    expect(params).toEqual([' ', '%Свердлова 13%']);
  });
});
