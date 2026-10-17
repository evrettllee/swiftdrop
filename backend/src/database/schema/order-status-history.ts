import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
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
  (table) => [index('order_status_history_order_id_idx').on(table.orderId)],
);
