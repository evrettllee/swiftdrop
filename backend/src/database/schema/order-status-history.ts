import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { ORDER_STATUS_HISTORY_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { sqlIntegerLiteral } from '../sql-literal';
import { orders, orderStatusEnum } from './orders';
import { users } from './users';

export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    statusHistoryId: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer()
      .notNull()
      .references(() => orders.orderId),
    status: orderStatusEnum().notNull(),
    changedBy: integer().references(() => users.userId),
    comment: text(),
    changedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('order_status_history_order_id_idx').on(table.orderId),
    check(
      'order_status_history_comment_length_check',
      sql`${table.comment} IS NULL OR char_length(${table.comment}) <= ${sqlIntegerLiteral(ORDER_STATUS_HISTORY_FIELD_LENGTH.COMMENT)}`,
    ),
  ],
);
