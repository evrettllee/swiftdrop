import { sql } from 'drizzle-orm';
import { boolean, integer, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { roles } from './roles';
import { PERSON_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';

export const users = pgTable(
  'users',
  {
    userId: integer().primaryKey().generatedAlwaysAsIdentity(),
    roleId: integer()
      .notNull()
      .references(() => roles.roleId),
    firstName: varchar({ length: PERSON_FIELD_LENGTH.NAME }).notNull(),
    lastName: varchar({ length: PERSON_FIELD_LENGTH.NAME }).notNull(),
    email: varchar({ length: PERSON_FIELD_LENGTH.EMAIL }).notNull(),
    passwordHash: varchar({ length: PERSON_FIELD_LENGTH.PASSWORD_HASH }),
    phone: varchar({ length: PERSON_FIELD_LENGTH.PHONE }).unique(),
    isBlocked: boolean().notNull().default(false),
    emailVerifiedAt: timestamp({ withTimezone: true }),
    deletedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_active_uidx')
      .on(table.email)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);
