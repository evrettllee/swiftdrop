import { sql } from 'drizzle-orm';
import { check, index, integer, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { SERVICE_FAILURE_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';
import { SERVICE_NAME_VALUES } from '@/common/enums/service-name.enum';

export const serviceNameEnum = pgEnum('service_name', SERVICE_NAME_VALUES);

export const serviceFailures = pgTable(
  'service_failures',
  {
    failureId: integer().primaryKey().generatedAlwaysAsIdentity(),
    service: serviceNameEnum().notNull(),
    code: varchar({ length: SERVICE_FAILURE_FIELD_LENGTH.CODE }).notNull(),
    message: varchar({ length: SERVICE_FAILURE_FIELD_LENGTH.MESSAGE }).notNull(),
    firstAt: timestamp({ withTimezone: true }).notNull(),
    lastAt: timestamp({ withTimezone: true }).notNull(),
    repeats: integer().notNull().default(1),
  },
  (table) => [
    index('service_failures_last_at_idx').on(table.lastAt.desc()),
    index('service_failures_service_code_last_at_idx').on(
      table.service,
      table.code,
      table.lastAt.desc(),
    ),
    check('service_failures_repeats_check', sql`${table.repeats} >= 1`),
  ],
);
