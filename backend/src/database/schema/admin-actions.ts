import { sql } from 'drizzle-orm';
import { check, index, integer, jsonb, pgEnum, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { ADMIN_ACTION, ADMIN_ACTION_VALUES } from '@/common/enums/admin-action.enum';
import { sqlLiteral } from '../sql-literal';
import { tariffs } from './tariffs';
import { users } from './users';

export const adminActionEnum = pgEnum('admin_action', ADMIN_ACTION_VALUES);

export const adminActions = pgTable(
  'admin_actions',
  {
    adminActionId: integer().primaryKey().generatedAlwaysAsIdentity(),
    actorId: integer()
      .notNull()
      .references(() => users.userId),
    targetUserId: integer().references(() => users.userId),
    tariffId: integer().references(() => tariffs.tariffId),
    action: adminActionEnum().notNull(),
    details: jsonb()
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('admin_actions_target_user_idx')
      .on(table.targetUserId, table.createdAt.desc())
      .where(sql`${table.targetUserId} IS NOT NULL`),
    index('admin_actions_tariff_idx')
      .on(table.tariffId, table.createdAt.desc())
      .where(sql`${table.tariffId} IS NOT NULL`),
    index('admin_actions_actor_idx').on(table.actorId, table.createdAt.desc()),
    check(
      'admin_actions_subject_check',
      sql`${table.targetUserId} IS NOT NULL OR ${table.tariffId} IS NOT NULL OR ${table.action} = ${sqlLiteral(ADMIN_ACTION.STAFF_PURGED)}`,
    ),
  ],
);
