import type { RoleName } from '../common/enums/role.enum';
import type { users } from '../db/schema';

export type User = typeof users.$inferSelect;

export type UserWithRole = User & { roleName: RoleName };

export type CreateUserInput = Pick<
  User,
  'firstName' | 'lastName' | 'email' | 'phone' | 'passwordHash'
> & {
  roleName: RoleName;
};
