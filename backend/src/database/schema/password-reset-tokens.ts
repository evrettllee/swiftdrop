import { sql } from 'drizzle-orm';
import { index, integer, pgEnum, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';
import { TOKEN_KIND, TOKEN_KIND_VALUES } from '@/common/enums/token-kind.enum';
import { users } from './users';
import { TOKEN_FIELD_LENGTH } from '@/common/constants/field-lengths.constants';

export const tokenKindEnum = pgEnum('token_kind', TOKEN_KIND_VALUES);

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    resetTokenId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.userId),
    tokenHash: varchar({ length: TOKEN_FIELD_LENGTH.HASH }).notNull().unique(),
    kind: tokenKindEnum().notNull().default(TOKEN_KIND.RESET),
    createdBy: integer().references(() => users.userId),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('password_reset_tokens_user_id_idx').on(table.userId),
    index('password_reset_tokens_active_idx')
      .on(table.userId, table.kind)
      .where(sql`${table.usedAt} IS NULL`),
  ],
);
