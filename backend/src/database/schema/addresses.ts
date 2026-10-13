import { doublePrecision, index, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const addresses = pgTable(
  'addresses',
  {
    addressId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.userId),
    label: varchar({ length: 100 }),
    city: varchar({ length: 100 }).notNull(),
    street: varchar({ length: 150 }).notNull(),
    house: varchar({ length: 20 }).notNull(),
    apartment: varchar({ length: 20 }),
    latitude: doublePrecision().notNull(),
    longitude: doublePrecision().notNull(),
  },
  (table) => [index('addresses_user_id_idx').on(table.userId)],
);
