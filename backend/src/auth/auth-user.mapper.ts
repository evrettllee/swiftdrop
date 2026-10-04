import type { RoleName } from '../common/enums/role.enum';
import type { User } from '../users/users.types';
import type { AuthUser } from './auth.types';

export function toAuthUser(user: User, role: RoleName): AuthUser {
  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role,
  };
}
