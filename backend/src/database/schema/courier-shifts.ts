import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { courierProfiles } from './courier-profiles';

export const courierShifts = pgTable(
  'courier_shifts',
  {
    shiftId: integer().primaryKey().generatedAlwaysAsIdentity(),
    courierId: integer()
      .notNull()
      .references(() => courierProfiles.courierProfileId),
    startedAt: timestamp({ withTimezone: true }).notNull(),
    endedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex('courier_shifts_one_open_per_courier_uidx')
      .on(table.courierId)
      .where(sql`${table.endedAt} IS NULL`),
    index('courier_shifts_courier_started_at_idx').on(table.courierId, table.startedAt),
    check('courier_shifts_period_check', sql`${table.endedAt} >= ${table.startedAt}`),
  ],
);
