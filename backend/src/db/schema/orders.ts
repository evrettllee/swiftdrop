import { index, integer, numeric, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { addresses } from './addresses';
import { courierProfiles } from './courier-profiles';
import { tariffs } from './tariffs';
import { users } from './users';

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'awaiting_manual_assignment',
  'courier_assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
  'rejected',
]);

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
    status: orderStatusEnum().notNull().default('pending'),
    recipientName: varchar({ length: 150 }).notNull(),
    recipientPhone: varchar({ length: 32 }).notNull(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    priceCoefficient: numeric({ precision: 4, scale: 2, mode: 'number' }).notNull().default(1),
    distanceKm: numeric({ precision: 8, scale: 2, mode: 'number' }).notNull(),
    estimatedDeliveryAt: timestamp({ withTimezone: true }),
    otpCode: varchar({ length: 4 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_client_id_idx').on(table.clientId),
    index('orders_courier_id_idx').on(table.courierId),
    index('orders_status_idx').on(table.status),
  ],
);
