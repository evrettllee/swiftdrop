import { doublePrecision, index, integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';
import { ADDRESS_FIELD_LENGTH } from '../../common/constants/field-lengths.constants';

export const addresses = pgTable(
  'addresses',
  {
    addressId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.userId),
    label: varchar({ length: ADDRESS_FIELD_LENGTH.LABEL }),
    city: varchar({ length: ADDRESS_FIELD_LENGTH.CITY }).notNull(),
    street: varchar({ length: ADDRESS_FIELD_LENGTH.STREET }).notNull(),
    house: varchar({ length: ADDRESS_FIELD_LENGTH.HOUSE }).notNull(),
    apartment: varchar({ length: ADDRESS_FIELD_LENGTH.APARTMENT }),
    latitude: doublePrecision().notNull(),
    longitude: doublePrecision().notNull(),
  },
  (table) => [index('addresses_user_id_idx').on(table.userId)],
);
