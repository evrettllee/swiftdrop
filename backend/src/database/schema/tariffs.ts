import { boolean, integer, numeric, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const tariffs = pgTable('tariffs', {
  tariffId: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 100 }).notNull(),
  pricePerKm: numeric({ precision: 10, scale: 2 }).notNull(),
  pricePerKg: numeric({ precision: 10, scale: 2 }).notNull(),
  minPrice: numeric({ precision: 10, scale: 2 }).notNull(),
  fragileFee: numeric({ precision: 10, scale: 2 }).notNull().default('0'),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
