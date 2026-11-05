import { and, desc, eq, type SQL, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { authorUnreadCount } from '@/common/database/order-support-ticket';
import type { Database, Transaction } from '@/database/database.module';
import { addresses, messages, orders, supportTickets } from '@/database/schema';

export const TICKET_STATE_COLUMNS = {
  ticketId: supportTickets.ticketId,
  userId: supportTickets.userId,
  status: supportTickets.status,
  awaitingStaff: supportTickets.awaitingStaff,
};

export function lastMessageOf(executor: Database | Transaction) {
  return executor
    .select({ text: messages.content, senderId: messages.senderId, sentAt: messages.sentAt })
    .from(messages)
    .where(eq(messages.ticketId, supportTickets.ticketId))
    .orderBy(desc(messages.messageId))
    .limit(1)
    .as('last_message');
}

export function ticketFields(last: ReturnType<typeof lastMessageOf>) {
  return {
    ticketId: supportTickets.ticketId,
    userId: supportTickets.userId,
    topic: supportTickets.topic,
    subject: supportTickets.subject,
    status: supportTickets.status,
    awaitingStaff: supportTickets.awaitingStaff,
    lastMessageAt: supportTickets.lastMessageAt,
    createdAt: supportTickets.createdAt,
    closedAt: supportTickets.closedAt,
    orderId: supportTickets.orderId,
    orderStatus: orders.status,
    lastMessageText: last.text,
    lastMessageSenderId: last.senderId,
    lastMessageSentAt: last.sentAt,
    unreadCount: authorUnreadCount().as('unread_count'),
  };
}

export function ownTicket(userId: number, ticketId: number): SQL | undefined {
  return and(eq(supportTickets.ticketId, ticketId), eq(supportTickets.userId, userId));
}

export function ticketListRows(executor: Database | Transaction, sortValue: SQL<string>) {
  const last = lastMessageOf(executor);

  return executor
    .select({ ...ticketFields(last), sortValue })
    .from(supportTickets)
    .leftJoin(orders, eq(orders.orderId, supportTickets.orderId))
    .leftJoinLateral(last, sql`true`);
}

export function ticketDetailsRows(executor: Database | Transaction) {
  const last = lastMessageOf(executor);
  const delivery = alias(addresses, 'delivery');

  return executor
    .select({
      ...ticketFields(last),
      delivery: {
        city: delivery.city,
        street: delivery.street,
        house: delivery.house,
        apartment: delivery.apartment,
      },
    })
    .from(supportTickets)
    .leftJoin(orders, eq(orders.orderId, supportTickets.orderId))
    .leftJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
    .leftJoinLateral(last, sql`true`);
}
