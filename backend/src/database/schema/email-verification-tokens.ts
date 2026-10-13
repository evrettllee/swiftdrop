import { index, integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const emailVerificationTokens = pgTable(
  'email_verification_tokens',
  {
    verificationTokenId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.userId),
    tokenHash: varchar({ length: 64 }).notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('email_verification_tokens_user_id_idx').on(table.userId)],
);
