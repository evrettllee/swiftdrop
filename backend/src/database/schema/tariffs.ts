import { type AnyColumn, sql, type SQL } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { TARIFF_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { MAX_TARIFF_PRICE } from '@/common/constants/tariffs.constants';
import { sqlIntegerLiteral } from '../sql-literal';

const MAX_PRICE = sqlIntegerLiteral(MAX_TARIFF_PRICE);

function priceRange(column: AnyColumn, lowerBound: SQL): SQL {
  return sql`${column} ${lowerBound} AND ${column} <= ${MAX_PRICE}`;
}

const POSITIVE = sql.raw('> 0');
const NOT_NEGATIVE = sql.raw('>= 0');

export const tariffs = pgTable(
  'tariffs',
  {
    tariffId: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: TARIFF_FIELD_LENGTH.NAME }).notNull(),
    pricePerKm: numeric({ precision: 10, scale: 2 }).notNull(),
    pricePerKg: numeric({ precision: 10, scale: 2 }).notNull(),
    minPrice: numeric({ precision: 10, scale: 2 }).notNull(),
    fragileFee: numeric({ precision: 10, scale: 2 }).notNull().default('0'),
    isActive: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('tariffs_name_lower_uidx').on(sql`lower(${table.name})`),
    check('tariffs_price_per_km_check', priceRange(table.pricePerKm, POSITIVE)),
    check('tariffs_price_per_kg_check', priceRange(table.pricePerKg, NOT_NEGATIVE)),
    check('tariffs_min_price_check', priceRange(table.minPrice, POSITIVE)),
    check('tariffs_fragile_fee_check', priceRange(table.fragileFee, NOT_NEGATIVE)),
  ],
);
