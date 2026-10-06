import { index, integer, numeric, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { PAYMENT_STATUS, PAYMENT_STATUS_VALUES } from '../../common/enums/payment-status.enum';
import { orders } from './orders';

export const paymentStatusEnum = pgEnum('payment_status', PAYMENT_STATUS_VALUES);

export const payments = pgTable(
  'payments',
  {
    paymentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer()
      .notNull()
      .references(() => orders.orderId),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    status: paymentStatusEnum().notNull().default(PAYMENT_STATUS.PENDING),
    stripePaymentId: varchar({ length: 255 }).unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('payments_order_id_idx').on(table.orderId)],
);
