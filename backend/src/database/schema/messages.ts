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
import { MESSAGE_FIELD_LENGTH } from '../../common/constants/field-lengths.constants';

export const messages = pgTable(
  'messages',
  {
    messageId: integer().primaryKey().generatedAlwaysAsIdentity(),
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
    index('messages_order_id_sent_at_idx').on(table.orderId, table.sentAt),
    index('messages_ticket_id_idx').on(table.ticketId),
  ],
);
