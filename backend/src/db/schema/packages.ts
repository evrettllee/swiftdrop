import { boolean, integer, numeric, pgTable } from 'drizzle-orm/pg-core';
import { orders } from './orders';

export const packages = pgTable('packages', {
  packageId: integer().primaryKey().generatedAlwaysAsIdentity(),
  orderId: integer()
    .notNull()
    .unique()
    .references(() => orders.orderId),
  weight: numeric({ precision: 8, scale: 2, mode: 'number' }).notNull(),
  length: numeric({ precision: 8, scale: 2, mode: 'number' }).notNull(),
  width: numeric({ precision: 8, scale: 2, mode: 'number' }).notNull(),
  height: numeric({ precision: 8, scale: 2, mode: 'number' }).notNull(),
  isFragile: boolean().notNull().default(false),
});
