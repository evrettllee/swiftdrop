import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notificationTypeEnum = pgEnum('notification_type', ['order', 'chat', 'payment']);

export const notifications = pgTable(
  'notifications',
  {
    notificationId: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => users.userId),
    type: notificationTypeEnum().notNull(),
    message: text().notNull(),
    isRead: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('notifications_user_id_idx').on(table.userId)],
);
