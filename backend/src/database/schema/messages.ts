import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { supportTickets } from './support-tickets';
import { users } from './users';
import { MESSAGE_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { sqlIntegerLiteral } from '../sql-literal';

export const messages = pgTable(
  'messages',
  {
    messageId: integer().primaryKey().generatedAlwaysAsIdentity(),
    // No index on the sender: users are never deleted (only blocked), and no query looks for
    // messages by their sender.
    senderId: integer()
      .notNull()
      .references(() => users.userId),
    receiverId: integer()
      .notNull()
      .references(() => users.userId),
    orderId: integer().references(() => orders.orderId),
    ticketId: integer().references(() => supportTickets.ticketId),
    content: text(),
    attachmentUrl: varchar({ length: MESSAGE_FIELD_LENGTH.ATTACHMENT_URL }),
    sentAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    isRead: boolean().notNull().default(false),
  },
  (table) => [
    check(
      'messages_context_chk',
      sql`${table.orderId} IS NOT NULL OR ${table.ticketId} IS NOT NULL`,
    ),
    // A message belongs to an order or to a ticket, never to both: each has its own participants.
    check(
      'messages_single_context_chk',
      sql`NOT (${table.orderId} IS NOT NULL AND ${table.ticketId} IS NOT NULL)`,
    ),
    check(
      'messages_content_length_chk',
      sql`${table.content} IS NULL OR char_length(${table.content}) <= ${sqlIntegerLiteral(MESSAGE_FIELD_LENGTH.CONTENT)}`,
    ),
    // The chat history of an order, page by page from the newest message back.
    index('messages_order_id_message_id_idx').on(table.orderId, table.messageId),
    // Unread messages of a receiver in an order: the counter and the marking as read. Only unread
    // rows are kept, so the index stays small.
    index('messages_unread_idx')
      .on(table.receiverId, table.orderId)
      .where(sql`${table.isRead} = false AND ${table.orderId} IS NOT NULL`),
    index('messages_ticket_id_idx').on(table.ticketId),
  ],
);
