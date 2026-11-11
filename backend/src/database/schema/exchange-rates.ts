import { numeric, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { CURRENCY_CODE_LENGTH } from '@/common/constants/field-lengths.constants';

export const exchangeRates = pgTable('exchange_rates', {
  currency: varchar({ length: CURRENCY_CODE_LENGTH }).primaryKey(),
  rate: numeric({ precision: 10, scale: 4, mode: 'number' }).notNull(),
  fetchedAt: timestamp({ withTimezone: true }).notNull(),
});
