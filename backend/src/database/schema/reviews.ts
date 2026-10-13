import { sql } from 'drizzle-orm';
import { check, integer, pgTable, smallint, text, timestamp } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const reviews = pgTable(
  'reviews',
  {
    reviewId: integer().primaryKey().generatedAlwaysAsIdentity(),
    orderId: integer()
      .notNull()
      .unique()
      .references(() => orders.orderId),
    rating: smallint().notNull(),
    comment: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('reviews_rating_chk', sql`${table.rating} BETWEEN 1 AND 5`)],
);
