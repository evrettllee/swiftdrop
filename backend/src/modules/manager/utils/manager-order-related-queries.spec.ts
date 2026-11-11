import { drizzle } from 'drizzle-orm/node-postgres';
import type { Database } from '@/database/database.module';
import * as schema from '@/database/schema';
import { findTickets } from './manager-order-related-queries';

const db = drizzle.mock({ schema, casing: 'snake_case' }) as unknown as Database;

describe('findTickets', () => {
  it('should put the tickets waiting for the staff first, then the latest, then the newest', () => {
    const { sql } = findTickets(db, 42).toSQL();

    expect(sql).toMatch(
      /order by "support_tickets"\."awaiting_staff" desc, "support_tickets"\."last_message_at" desc, "support_tickets"\."ticket_id" desc$/,
    );
  });
});
