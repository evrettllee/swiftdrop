import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import {
  ORDER_OFFER_STATUS,
  ORDER_OFFER_STATUS_VALUES,
} from '@/common/enums/order-offer-status.enum';
import { sqlLiteral } from '../sql-literal';
import { courierProfiles } from './courier-profiles';
import { orders } from './orders';

export const orderOfferStatusEnum = pgEnum('order_offer_status', ORDER_OFFER_STATUS_VALUES);

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
    status: orderOfferStatusEnum().notNull().default(ORDER_OFFER_STATUS.PENDING),
    offeredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    respondedAt: timestamp({ withTimezone: true }),
    pickupEtaSec: integer().notNull(),
    totalEtaSec: integer().notNull(),
  },
  (table) => [
    index('order_offers_courier_id_idx').on(table.courierId),
    // An order is offered to the same courier at most once; also serves lookups by order.
    uniqueIndex('order_offers_order_courier_uidx').on(table.orderId, table.courierId),
    // One open offer per order and per courier, one courier who accepted an order.
    uniqueIndex('order_offers_one_pending_per_order_uidx')
      .on(table.orderId)
      .where(sql`${table.status} = ${sqlLiteral(ORDER_OFFER_STATUS.PENDING)}`),
    uniqueIndex('order_offers_one_accepted_per_order_uidx')
      .on(table.orderId)
      .where(sql`${table.status} = ${sqlLiteral(ORDER_OFFER_STATUS.ACCEPTED)}`),
    uniqueIndex('order_offers_one_pending_per_courier_uidx')
      .on(table.courierId)
      .where(sql`${table.status} = ${sqlLiteral(ORDER_OFFER_STATUS.PENDING)}`),
    // The job that expires offers reads only the open ones.
    index('order_offers_pending_expires_at_idx')
      .on(table.expiresAt)
      .where(sql`${table.status} = ${sqlLiteral(ORDER_OFFER_STATUS.PENDING)}`),
    check(
      'order_offers_eta_check',
      sql`${table.pickupEtaSec} >= 0 AND ${table.totalEtaSec} >= ${table.pickupEtaSec}`,
    ),
  ],
);
