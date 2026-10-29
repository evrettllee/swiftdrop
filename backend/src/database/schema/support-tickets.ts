import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { SUPPORT_TICKET_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import {
  SUPPORT_TICKET_STATUS,
  SUPPORT_TICKET_STATUS_VALUES,
  TICKET_TOPIC,
  TICKET_TOPIC_VALUES,
} from '@/common/enums/support-ticket.enum';
import { sqlIntegerLiteral, sqlLiteral } from '../sql-literal';
import { orders } from './orders';
import { users } from './users';

export const supportTicketStatusEnum = pgEnum(
  'support_ticket_status',
  SUPPORT_TICKET_STATUS_VALUES,
);

export const ticketTopicEnum = pgEnum('ticket_topic', TICKET_TOPIC_VALUES);

export const supportTickets = pgTable(
  'support_tickets',
  {
    ticketId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.userId),
    orderId: integer().references(() => orders.orderId),
    topic: ticketTopicEnum().notNull(),
    subject: varchar({ length: SUPPORT_TICKET_FIELD_LENGTH.SUBJECT }),
    status: supportTicketStatusEnum().notNull().default(SUPPORT_TICKET_STATUS.OPEN),
    lastMessageAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    awaitingStaff: boolean().notNull().default(true),
    closedAt: timestamp({ withTimezone: true }),
    closedBy: integer().references(() => users.userId),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('support_tickets_user_id_ticket_id_idx').on(
      table.userId,
      table.ticketId.desc().nullsFirst(),
    ),
    index('support_tickets_order_id_idx').on(table.orderId),
    index('support_tickets_queue_idx')
      .on(table.awaitingStaff, table.lastMessageAt)
      .where(sql`${table.status} <> ${sqlLiteral(SUPPORT_TICKET_STATUS.CLOSED)}`),
    uniqueIndex('support_tickets_one_open_per_order_uidx')
      .on(table.orderId, table.userId)
      .where(
        sql`${table.status} <> ${sqlLiteral(SUPPORT_TICKET_STATUS.CLOSED)} AND ${table.orderId} IS NOT NULL`,
      ),
    check(
      'support_tickets_subject_required_check',
      sql`${table.topic} <> ${sqlLiteral(TICKET_TOPIC.OTHER)} OR ${table.subject} IS NOT NULL`,
    ),
    check(
      'support_tickets_subject_length_check',
      sql`${table.subject} IS NULL OR char_length(${table.subject}) BETWEEN ${sqlIntegerLiteral(SUPPORT_TICKET_FIELD_LENGTH.SUBJECT_MIN)} AND ${sqlIntegerLiteral(SUPPORT_TICKET_FIELD_LENGTH.SUBJECT)}`,
    ),
    check(
      'support_tickets_closed_check',
      sql`(${table.status} = ${sqlLiteral(SUPPORT_TICKET_STATUS.CLOSED)}) = (${table.closedAt} IS NOT NULL)`,
    ),
  ],
);
