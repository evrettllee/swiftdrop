import { index, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';
import { TOKEN_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    resetTokenId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.userId),
    tokenHash: varchar({ length: TOKEN_FIELD_LENGTH.HASH }).notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('password_reset_tokens_user_id_idx').on(table.userId)],
);
