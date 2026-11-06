import { and, eq, exists, type SQL, sql } from 'drizzle-orm';
import { SUPPORT_TICKET_STATUS } from '@/common/enums/support-ticket.enum';
import type { Database } from '@/database/database.module';
import { orders, packages, supportTickets } from '@/database/schema';

export function fragileCondition(db: Database): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(packages)
      .where(and(eq(packages.orderId, orders.orderId), eq(packages.isFragile, true))),
  );
}

export function openTicketCondition(db: Database): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(supportTickets)
      .where(
        and(
          eq(supportTickets.orderId, orders.orderId),
          eq(supportTickets.status, SUPPORT_TICKET_STATUS.OPEN),
        ),
      ),
  );
}
