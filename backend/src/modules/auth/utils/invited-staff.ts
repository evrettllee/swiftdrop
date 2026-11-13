import type { UserWithRole } from '@/modules/users/types/users.types';
import { INVITABLE_ROLES } from '../constants/mail.constants';

const invitableRoles = new Set<string>(INVITABLE_ROLES);

export function isInvitedStaff(user: UserWithRole): boolean {
  return (
    invitableRoles.has(user.roleName) &&
    user.passwordHash === null &&
    user.lastLoginAt === null &&
    user.deletedAt === null
  );
}
