import type { SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import {
  staffTicketRows,
  supportCountsQuery,
  ticketSearchCondition,
  viewCondition,
} from './support-staff-query';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;
const dialect = new PgDialect({ casing: 'snake_case' });
const render = (query: SQL | undefined) => (query ? dialect.sqlToQuery(query) : null);

describe('staff ticket filters', () => {
  it.each([
    [
      'awaiting',
      '("support_tickets"."status" = $1 and "support_tickets"."awaiting_staff" = $2)',
      ['open', true],
    ],
    ['open', '"support_tickets"."status" = $1', ['open']],
    ['closed', '"support_tickets"."status" = $1', ['closed']],
  ] as const)('should keep the %s tickets', (view, text, params) => {
    expect(render(viewCondition(view))).toMatchObject({ sql: text, params });
  });

  it('should find by the ticket, the order or the phone of the author for digits', () => {
    const found = render(
      ticketSearchCondition({ kind: 'number', orderId: 12, phone: '+375291234567' }),
    );

    expect(found?.sql).toBe(
      '("support_tickets"."ticket_id" = $1 or "support_tickets"."order_id" = $2 or "users"."phone" = $3)',
    );
    expect(found?.params).toEqual([12, 12, '+375291234567']);
  });

  it('should find by the name of the author for text', () => {
    expect(render(ticketSearchCondition({ kind: 'text', pattern: '%Иван%' }))?.sql).toBe(
      '("users"."first_name" || \' \' || "users"."last_name") ilike $1',
    );
  });
});

describe('staff ticket rows and counts', () => {
  it('should count the waiting seconds only for an open ticket that waits for staff', () => {
    const { sql } = staffTicketRows(
      db,
      schema.supportTickets.ticketId as unknown as SQL<string>,
    ).toSQL();

    expect(sql).toMatch(
      /case\s+when "support_tickets"."status" = \$\d+ and "support_tickets"."awaiting_staff"\s+then floor\(extract\(epoch from now\(\) - "support_tickets"."last_message_at"\)\)::int\s+end/,
    );
  });

  it('should count the awaiting and the open tickets in one query', () => {
    const { sql, params } = supportCountsQuery(db).toSQL();

    expect(sql).toContain('(count(*) filter (where "awaiting_staff"))::int');
    expect(sql).toContain('where "support_tickets"."status" = $1');
    expect(params).toEqual(['open']);
  });
});
