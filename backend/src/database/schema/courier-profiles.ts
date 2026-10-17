import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { COURIER_PROFILE_FIELD_LENGTH } from '../../common/constants/field-lengths.constants';
import { users } from './users';

export const courierProfiles = pgTable(
  'courier_profiles',
  {
    courierProfileId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .unique()
      .references(() => users.userId),
    avatarUrl: varchar({ length: COURIER_PROFILE_FIELD_LENGTH.AVATAR_URL }),
    isAvailable: boolean().notNull().default(false),
    currentLat: doublePrecision(),
    currentLng: doublePrecision(),
    locationUpdatedAt: timestamp({ withTimezone: true }),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Assignment looks only at couriers on shift, ordered by how fresh their position is.
    index('courier_profiles_available_location_idx')
      .on(table.locationUpdatedAt)
      .where(sql`${table.isAvailable}`),
    check(
      'courier_profiles_location_pair_check',
      sql`(${table.currentLat} IS NULL) = (${table.currentLng} IS NULL)
        AND (${table.currentLat} IS NULL) = (${table.locationUpdatedAt} IS NULL)`,
    ),
  ],
);
