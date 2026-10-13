import { integer, pgEnum, pgTable, timestamp, unique, varchar } from 'drizzle-orm/pg-core';
import { OAUTH_PROVIDER_VALUES } from '../../common/enums/oauth-provider.enum';
import { users } from './users';
import { OAUTH_ACCOUNT_FIELD_LENGTH } from '../../common/constants/field-lengths.constants';

export const oauthProviderEnum = pgEnum('oauth_provider', OAUTH_PROVIDER_VALUES);

export const userOauthAccounts = pgTable(
  'user_oauth_accounts',
  {
    oauthId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.userId),
    provider: oauthProviderEnum().notNull(),
    providerUserId: varchar({ length: OAUTH_ACCOUNT_FIELD_LENGTH.PROVIDER_USER_ID }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('user_oauth_accounts_provider_user_uq').on(table.provider, table.providerUserId),
  ],
);
