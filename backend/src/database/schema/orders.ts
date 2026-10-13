import { index, integer, numeric, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { ORDER_STATUS, ORDER_STATUS_VALUES } from '../../common/enums/order-status.enum';
import { addresses } from './addresses';
import { courierProfiles } from './courier-profiles';
import { tariffs } from './tariffs';
import { users } from './users';
import { ORDER_FIELD_LENGTH, PERSON_FIELD_LENGTH } from '../../common/constants/field-lengths.constants';

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
    estimatedDeliveryAt: timestamp({ withTimezone: true }),
    otpCode: varchar({ length: ORDER_FIELD_LENGTH.OTP_CODE }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_client_id_idx').on(table.clientId),
    index('orders_courier_id_idx').on(table.courierId),
    index('orders_status_idx').on(table.status),
  ],
);
