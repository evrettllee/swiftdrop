import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import {
  ORDER_FIELD_LENGTH,
  PERSON_FIELD_LENGTH,
} from '@/common/constants/field-lengths.constants';
import { COURIER_ACTIVE_ORDER_STATUSES } from '@/common/constants/orders.constants';
import { ORDER_STATUS, ORDER_STATUS_VALUES } from '@/common/enums/order-status.enum';
import { sqlLiteralList } from '../sql-literal';
import { addresses } from './addresses';
import { courierProfiles } from './courier-profiles';
import { tariffs } from './tariffs';
import { users } from './users';

export const orderStatusEnum = pgEnum('order_status', ORDER_STATUS_VALUES);

export const orders = pgTable(
  'orders',
  {
    orderId: integer().primaryKey().generatedAlwaysAsIdentity(),
    clientId: integer()
      .notNull()
      .references(() => users.userId),
    courierId: integer().references(() => courierProfiles.courierProfileId),
    tariffId: integer()
      .notNull()
      .references(() => tariffs.tariffId),
    pickupAddressId: integer()
      .notNull()
      .references(() => addresses.addressId),
    deliveryAddressId: integer()
      .notNull()
      .references(() => addresses.addressId),
    status: orderStatusEnum().notNull().default(ORDER_STATUS.PENDING),
    recipientName: varchar({ length: ORDER_FIELD_LENGTH.RECIPIENT_NAME }).notNull(),
    recipientPhone: varchar({ length: PERSON_FIELD_LENGTH.PHONE }).notNull(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    priceCoefficient: numeric({ precision: 4, scale: 2, mode: 'number' }).notNull().default(1),
    distanceKm: numeric({ precision: 8, scale: 2, mode: 'number' }).notNull(),
    // The time of the trip given when the order was placed, in minutes; it never changes, while the
    // arrival estimate moves estimatedDeliveryAt. Null for orders placed before it was kept.
    estimatedMinutes: integer(),
    estimatedDeliveryAt: timestamp({ withTimezone: true }),
    otpCode: varchar({ length: ORDER_FIELD_LENGTH.OTP_CODE }),
    // Wrong delivery codes in a row; entering is locked until otpLockedUntil after too many.
    otpFailedAttempts: smallint().notNull().default(0),
    otpLockedUntil: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_client_id_idx').on(table.clientId),
    index('orders_courier_id_idx').on(table.courierId),
    index('orders_status_idx').on(table.status),
    // A courier carries at most one order at a time, even when two offers are accepted at once.
    uniqueIndex('orders_one_active_per_courier_uidx')
      .on(table.courierId)
      .where(sql`${table.status} IN (${sqlLiteralList(COURIER_ACTIVE_ORDER_STATUSES)})`),
    check('orders_otp_code_check', sql`${table.otpCode} ~ '^[0-9]{4}$'`),
    check('orders_otp_failed_attempts_check', sql`${table.otpFailedAttempts} >= 0`),
    check('orders_estimated_minutes_check', sql`${table.estimatedMinutes} >= 0`),
  ],
);
