import { integer, pgEnum, pgTable, timestamp, unique, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const oauthProviderEnum = pgEnum('oauth_provider', ['google', 'yandex']);

export const userOauthAccounts = pgTable(
  'user_oauth_accounts',
  {
    oauthId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.userId),
    provider: oauthProviderEnum().notNull(),
    providerUserId: varchar({ length: 255 }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('user_oauth_accounts_provider_user_uq').on(table.provider, table.providerUserId),
  ],
);
