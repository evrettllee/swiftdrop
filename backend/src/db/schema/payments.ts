import { index, integer, numeric, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
]);

export const payments = pgTable(
  'payments',
  {
    paymentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer()
      .notNull()
      .references(() => orders.orderId),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    status: paymentStatusEnum().notNull().default('pending'),
    stripePaymentId: varchar({ length: 255 }).unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('payments_order_id_idx').on(table.orderId)],
);
