import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import type { RoleName } from '../../common/enums/role.enum';
import { ROLE_FIELD_LENGTH } from '../../common/constants/field-lengths.constants';

export const roles = pgTable('roles', {
  roleId: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: ROLE_FIELD_LENGTH.NAME }).$type<RoleName>().notNull().unique(),
});
