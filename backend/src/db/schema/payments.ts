import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { PAYMENT_STATUS, PAYMENT_STATUS_VALUES } from '../../common/enums/payment-status.enum';
import { PAYMENTS_ONE_PENDING_PER_ORDER_INDEX } from '../../common/constants/database.constants';
import { orders } from './orders';

export const paymentStatusEnum = pgEnum('payment_status', PAYMENT_STATUS_VALUES);

// One row is one attempt to pay: a retry after an expired session adds a new row.
export const payments = pgTable(
  'payments',
  {
    paymentId: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer()
      .notNull()
      .references(() => orders.orderId),
    // The order price in BYN.
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    // What is really charged in US dollars, and the NBRB rate (BYN for one dollar) it was counted by.
    amountUsd: numeric({ precision: 10, scale: 2 }).notNull(),
    exchangeRate: numeric({ precision: 10, scale: 4, mode: 'number' }).notNull(),
    status: paymentStatusEnum().notNull().default(PAYMENT_STATUS.PENDING),
    checkoutSessionId: varchar({ length: 255 }).notNull().unique(),
    // The reference of the payment in Stripe, it is known after the payment and used for a refund.
    stripePaymentId: varchar({ length: 255 }).unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('payments_order_id_idx').on(table.orderId),
    // An order has at most one open attempt, so it cannot be paid twice through two sessions.
    uniqueIndex(PAYMENTS_ONE_PENDING_PER_ORDER_INDEX)
      .on(table.orderId)
      .where(sql`${table.status} = ${sql.raw(`'${PAYMENT_STATUS.PENDING}'`)}`),
  ],
);
