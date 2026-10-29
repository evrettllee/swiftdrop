import type { SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import {
  managerOrderConditions,
  paymentCondition,
  paymentStateSql,
  searchCondition,
  statusGroupsCondition,
} from './manager-order-conditions';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;
const dialect = new PgDialect({ casing: 'snake_case' });
const NO_FILTERS = {
  period: { start: null, end: null },
  courierId: null,
  payment: null,
  fragile: false,
  search: null,
};

function render(fragment: SQL | undefined) {
  return fragment ? dialect.sqlToQuery(fragment) : null;
}

describe('statusGroupsCondition', () => {
  it('should take every status when no group is chosen', () => {
    expect(statusGroupsCondition(null)).toBeUndefined();
  });

  it('should join the statuses of the chosen groups once each', () => {
    const query = render(statusGroupsCondition(['attention', 'active', 'cancelled']));

    expect(query?.params).toEqual([
      'awaiting_manual_assignment',
      'confirmed',
      'courier_assigned',
      'picked_up',
      'in_transit',
      'cancelled',
      'rejected',
    ]);
  });

  it('should map waiting for payment to pending and finished to delivered only', () => {
    expect(render(statusGroupsCondition(['awaiting_payment']))?.params).toEqual(['pending']);
    expect(render(statusGroupsCondition(['finished']))?.params).toEqual(['delivered']);
  });
});

describe('paymentCondition', () => {
  it('should take every order when no state is chosen', () => {
    expect(paymentCondition(db, null)).toBeUndefined();
  });

  it('should look for a payment of the order in a correlated EXISTS, not a join', () => {
    const query = render(paymentCondition(db, ['paid']));

    expect(query?.sql).toContain(
      'exists (select 1 from "payments" where ("payments"."order_id" = "orders"."order_id"',
    );
    expect(query?.params).toEqual(['paid']);
  });

  it('should read refunded as a refund with no paid attempt', () => {
    const query = render(paymentCondition(db, ['refunded']));

    expect(query?.sql).toMatch(/^\(not exists .* and exists .*\)$/);
    expect(query?.params).toEqual(['paid', 'refunded']);
  });

  it('should read unpaid as neither a paid attempt nor a refund', () => {
    const query = render(paymentCondition(db, ['unpaid']));

    expect(query?.sql).toMatch(/^\(not exists .* and not exists .*\)$/);
  });

  it('should join several states with OR', () => {
    expect(render(paymentCondition(db, ['paid', 'unpaid']))?.sql).toContain(' or ');
  });

  it('should name the state by paid first, then refunded, else unpaid', () => {
    const query = render(paymentStateSql(db));

    expect(query?.sql).toMatch(
      /^CASE WHEN exists .* THEN \$\d+ WHEN exists .* THEN \$\d+ ELSE \$\d+ END$/,
    );
    expect(query?.params).toEqual(['paid', 'paid', 'refunded', 'refunded', 'unpaid']);
  });
});

describe('searchCondition', () => {
  it('should look for an order id, a client phone and a recipient phone in one union', () => {
    const query = render(
      searchCondition(db, { kind: 'number', orderId: 42, phone: '+375291234567' }),
    );

    expect(query?.sql).toContain('"orders"."order_id" in (');
    expect(query?.sql.match(/ union /g)).toHaveLength(2);
    expect(query?.sql).toContain('"users"."phone" = $');
    expect(query?.sql).toContain('"search_orders"."recipient_phone" = $');
    expect(query?.params).toEqual([42, '+375291234567', '+375291234567']);
  });

  it('should look for the order id alone when the digits are no phone', () => {
    const query = render(searchCondition(db, { kind: 'number', orderId: 42, phone: null }));

    expect(query?.sql).not.toContain('union');
    expect(query?.params).toEqual([42]);
  });

  it('should match nothing when the digits are neither an id nor a phone', () => {
    expect(render(searchCondition(db, { kind: 'number', orderId: null, phone: null }))?.sql).toBe(
      'false',
    );
  });

  it('should search the full name and email of the client and the recipient name by ILIKE', () => {
    const query = render(searchCondition(db, { kind: 'text', pattern: '%Анна%' }));

    expect(query?.sql).toContain(`("users"."first_name" || ' ' || "users"."last_name") ilike $1`);
    expect(query?.sql).toContain('"users"."email" ilike $2');
    expect(query?.sql).toContain('"search_orders"."recipient_name" ilike $3');
    expect(query?.params).toEqual(['%Анна%', '%Анна%', '%Анна%']);
  });
});

describe('managerOrderConditions', () => {
  it('should add nothing without filters', () => {
    expect(managerOrderConditions(db, NO_FILTERS)).toBeUndefined();
  });

  it('should keep the period half-open and add the courier and fragile parcels', () => {
    const start = new Date('2026-10-28T21:00:00.000Z');
    const end = new Date('2026-10-29T21:00:00.000Z');
    const query = render(
      managerOrderConditions(db, {
        ...NO_FILTERS,
        period: { start, end },
        courierId: 3,
        fragile: true,
      }),
    );

    expect(query?.sql).toContain('"orders"."created_at" >= $1');
    expect(query?.sql).toContain('"orders"."created_at" < $2');
    expect(query?.sql).toContain('"orders"."courier_id" = $3');
    expect(query?.sql).toContain('"packages"."is_fragile" = $4');
    expect(query?.params).toEqual([start.toISOString(), end.toISOString(), 3, true]);
  });
});
