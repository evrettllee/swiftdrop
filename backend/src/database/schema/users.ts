import { sql } from 'drizzle-orm';
import { boolean, integer, pgTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { roles } from './roles';

export const users = pgTable(
  'users',
  {
    userId: integer().primaryKey().generatedAlwaysAsIdentity(),
    roleId: integer()
      .notNull()
      .references(() => roles.roleId),
    firstName: varchar({ length: 100 }).notNull(),
    lastName: varchar({ length: 100 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    passwordHash: varchar({ length: 255 }),
    phone: varchar({ length: 32 }).unique(),
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
