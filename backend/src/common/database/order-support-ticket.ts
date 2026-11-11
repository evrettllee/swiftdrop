import { and, eq, ne, type SQL, sql } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import {
  SUPPORT_TICKET_STATUS,
  type SupportTicketStatus,
} from '@/common/enums/support-ticket.enum';
import type { Database, Transaction } from '@/database/database.module';
import { messages, orders, supportTickets } from '@/database/schema';

export type OrderSupportTicket = {
  ticketId: number;
  status: SupportTicketStatus;
  awaitingStaff: boolean;
  unreadCount: number;
  lastMessageAt: Date;
};

function staffMessageCondition(): SQL {
  return sql`${messages.senderId} <> ${supportTickets.userId}`;
}

export function authorUnreadCount(): SQL<number> {
  return sql<number>`(
    select count(*)::int from ${messages}
    where ${messages.ticketId} = ${supportTickets.ticketId}
      and ${staffMessageCondition()}
      and ${messages.isRead} = false
  )`;
}

export function openOrderTicketQuery(
  executor: Database | Transaction,
  userId: number,
  orderId: number,
) {
  return executor
    .select({
      ticketId: supportTickets.ticketId,
      status: supportTickets.status,
      awaitingStaff: supportTickets.awaitingStaff,
      unreadCount: authorUnreadCount(),
      lastMessageAt: supportTickets.lastMessageAt,
    })
    .from(supportTickets)
    .innerJoin(orders, eq(orders.orderId, supportTickets.orderId))
    .where(
      and(
        eq(supportTickets.orderId, orderId),
        eq(supportTickets.userId, userId),
        ne(supportTickets.status, SUPPORT_TICKET_STATUS.CLOSED),
      ),
    )
    .limit(SINGLE_ROW_LIMIT);
}

export async function findOpenOrderTicket(
  executor: Database | Transaction,
  userId: number,
  orderId: number,
): Promise<OrderSupportTicket | null> {
  const [row] = await openOrderTicketQuery(executor, userId, orderId);

  return row ?? null;
}
