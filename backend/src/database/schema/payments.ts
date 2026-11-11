import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { PAYMENT_STATUS, PAYMENT_STATUS_VALUES } from '@/common/enums/payment-status.enum';
import { PAYMENTS_ONE_PENDING_PER_ORDER_INDEX } from '@/common/constants/database.constants';
import { sqlLiteral } from '../sql-literal';
import { orders } from './orders';
import { PAYMENT_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';

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
    checkoutSessionId: varchar({ length: PAYMENT_FIELD_LENGTH.CHECKOUT_SESSION_ID })
      .notNull()
      .unique(),
    // The reference of the payment in Stripe, it is known after the payment and used for a refund.
    stripePaymentId: varchar({ length: PAYMENT_FIELD_LENGTH.STRIPE_PAYMENT_ID }).unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp({ withTimezone: true }),
    refundedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index('payments_order_id_idx').on(table.orderId),
    // An order has at most one open attempt, so it cannot be paid twice through two sessions.
    uniqueIndex(PAYMENTS_ONE_PENDING_PER_ORDER_INDEX)
      .on(table.orderId)
      .where(sql`${table.status} = ${sql.raw(`'${PAYMENT_STATUS.PENDING}'`)}`),
    index('payments_paid_at_idx')
      .on(table.paidAt)
      .where(sql`${table.status} = ${sqlLiteral(PAYMENT_STATUS.PAID)}`),
    check(
      'payments_paid_at_check',
      sql`${table.status} <> ${sqlLiteral(PAYMENT_STATUS.PAID)} OR ${table.paidAt} IS NOT NULL`,
    ),
    check(
      'payments_refunded_at_check',
      sql`${table.status} <> ${sqlLiteral(PAYMENT_STATUS.REFUNDED)} OR ${table.refundedAt} IS NOT NULL`,
    ),
  ],
);
