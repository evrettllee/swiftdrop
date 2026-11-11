import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { openOrderTicketQuery } from './order-support-ticket';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;

describe('openOrderTicketQuery', () => {
  it('should look only at the not closed ticket of this user on this order', () => {
    const { sql, params } = openOrderTicketQuery(db, 7, 48232).toSQL();

    expect(sql).toContain(
      '("support_tickets"."order_id" = $1 and "support_tickets"."user_id" = $2 and "support_tickets"."status" <> $3)',
    );
    expect(sql).toContain('limit $4');
    expect(params).toEqual([48232, 7, 'closed', 1]);
  });

  it('should count the unread messages of the staff as the list of the author does', () => {
    const { sql } = openOrderTicketQuery(db, 7, 48232).toSQL();

    expect(sql).toContain('"messages"."ticket_id" = "support_tickets"."ticket_id"');
    expect(sql).toContain('"messages"."sender_id" <> "support_tickets"."user_id"');
    expect(sql).toContain('"messages"."is_read" = false');
  });
});
