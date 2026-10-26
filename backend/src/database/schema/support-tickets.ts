import { index, integer, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { orders } from './orders';
import { users } from './users';
import { SUPPORT_TICKET_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';

export const supportTicketStatusEnum = pgEnum('support_ticket_status', [
  'open',
  'in_progress',
  'closed',
]);

export const supportTickets = pgTable(
  'support_tickets',
  {
    ticketId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.userId),
    orderId: integer().references(() => orders.orderId),
    subject: varchar({ length: SUPPORT_TICKET_FIELD_LENGTH.SUBJECT }).notNull(),
    status: supportTicketStatusEnum().notNull().default('open'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('support_tickets_user_id_idx').on(table.userId)],
);
