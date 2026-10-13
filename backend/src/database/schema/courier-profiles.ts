import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const courierProfiles = pgTable('courier_profiles', {
  courierProfileId: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .unique()
    .references(() => users.userId),
  avatarUrl: varchar({ length: 500 }),
  isAvailable: boolean().notNull().default(false),
  currentLat: doublePrecision(),
  currentLng: doublePrecision(),
  locationUpdatedAt: timestamp({ withTimezone: true }),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
