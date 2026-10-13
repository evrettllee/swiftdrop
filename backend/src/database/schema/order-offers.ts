import { index, integer, pgEnum, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { courierProfiles } from './courier-profiles';
import { orders } from './orders';

export const orderOfferStatusEnum = pgEnum('order_offer_status', [
  'pending',
  'accepted',
  'declined',
  'expired',
]);

export const orderOffers = pgTable(
  'order_offers',
  {
    offerId: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer()
      .notNull()
      .references(() => orders.orderId),
    courierId: integer()
      .notNull()
      .references(() => courierProfiles.courierProfileId),
    status: orderOfferStatusEnum().notNull().default('pending'),
    offeredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    respondedAt: timestamp({ withTimezone: true }),
    pickupEtaSec: integer().notNull(),
    totalEtaSec: integer().notNull(),
  },
  (table) => [
    index('order_offers_order_id_idx').on(table.orderId),
    index('order_offers_courier_id_idx').on(table.courierId),
  ],
);
