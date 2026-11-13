import { inArray, type SQL, sql } from 'drizzle-orm';
import { roles, users } from '@/database/schema';
import { MANAGED_ROLES } from '../constants/admin-users.constants';

export const managedRole: SQL = inArray(roles.name, [...MANAGED_ROLES]);

export const USER_ROW_COLUMNS = {
  userId: users.userId,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
  phone: users.phone,
  createdAt: users.createdAt,
  lastLoginAt: users.lastLoginAt,
  isBlocked: users.isBlocked,
  deletedAt: users.deletedAt,
  roleName: roles.name,
  hasPassword: sql<boolean>`${users.passwordHash} is not null`,
};
