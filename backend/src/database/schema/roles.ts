import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import type { RoleName } from '../../common/enums/role.enum';

export const roles = pgTable('roles', {
  roleId: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 50 }).$type<RoleName>().notNull().unique(),
});
