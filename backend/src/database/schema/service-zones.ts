import { sql } from 'drizzle-orm';
import { boolean, check, integer, jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { SERVICE_ZONE_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { sqlIntegerLiteral } from '../sql-literal';
import { tariffs } from './tariffs';

export const serviceZones = pgTable(
  'service_zones',
  {
    zoneId: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: SERVICE_ZONE_FIELD_LENGTH.NAME }).notNull(),
    polygon: jsonb().$type<number[][][]>().notNull(),
    tariffId: integer()
      .notNull()
      .references(() => tariffs.tariffId),
    priority: integer().notNull().default(0),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      'service_zones_name_length_check',
      sql`char_length(${table.name}) BETWEEN ${sqlIntegerLiteral(SERVICE_ZONE_FIELD_LENGTH.NAME_MIN)} AND ${sqlIntegerLiteral(SERVICE_ZONE_FIELD_LENGTH.NAME)}`,
    ),
  ],
);
