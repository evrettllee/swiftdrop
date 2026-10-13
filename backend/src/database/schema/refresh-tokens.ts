import { index, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';
import { TOKEN_FIELD_LENGTH } from '../../common/constants/field-lengths.constants';

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    tokenId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.userId),
    tokenHash: varchar({ length: TOKEN_FIELD_LENGTH.HASH }).notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
    // Set when the token was replaced by a rotation, not when a logout or a theft revoked it: for a
    // short while such a token is accepted again (two tabs refreshing at once).
    rotatedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('refresh_tokens_user_id_idx').on(table.userId)],
);
