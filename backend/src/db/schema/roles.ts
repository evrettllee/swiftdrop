import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  roleId: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 50 }).notNull().unique(),
});
