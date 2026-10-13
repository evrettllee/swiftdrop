import { boolean, integer, jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { tariffs } from './tariffs';

export const serviceZones = pgTable('service_zones', {
  zoneId: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 100 }).notNull(),
  polygon: jsonb().$type<number[][][]>().notNull(),
  tariffId: integer()
    .notNull()
    .references(() => tariffs.tariffId),
  priority: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
