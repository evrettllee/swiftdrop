import { and, eq, inArray, isNotNull, isNull, notInArray, or, type SQL } from 'drizzle-orm';
import { roles, users } from '@/database/schema';
import { INVITABLE_ROLES } from '@/modules/auth/constants/mail.constants';
import { USER_STATUS } from '../constants/admin-users.constants';
import type { UserStatus, UserStatusFacts } from '../types/admin-users.types';

const invitableRoles = new Set<string>(INVITABLE_ROLES);

export function deriveUserStatus(facts: UserStatusFacts): UserStatus {
  if (facts.deletedAt !== null) {
    return USER_STATUS.DELETED;
  }

  if (facts.isBlocked) {
    return USER_STATUS.BLOCKED;
  }

  const isInvited =
    invitableRoles.has(facts.roleName) && !facts.hasPassword && facts.lastLoginAt === null;

  return isInvited ? USER_STATUS.INVITED : USER_STATUS.ACTIVE;
}

const notDeleted = isNull(users.deletedAt);
const notBlocked = eq(users.isBlocked, false);

const STATUS_CONDITIONS: Record<UserStatus, SQL | undefined> = {
  [USER_STATUS.DELETED]: isNotNull(users.deletedAt),
  [USER_STATUS.BLOCKED]: and(notDeleted, eq(users.isBlocked, true)),
  [USER_STATUS.INVITED]: and(
    notDeleted,
    notBlocked,
    isNull(users.passwordHash),
    isNull(users.lastLoginAt),
    inArray(roles.name, [...INVITABLE_ROLES]),
  ),
  [USER_STATUS.ACTIVE]: and(
    notDeleted,
    notBlocked,
    or(
      isNotNull(users.passwordHash),
      isNotNull(users.lastLoginAt),
      notInArray(roles.name, [...INVITABLE_ROLES]),
    ),
  ),
};

export function statusCondition(statuses: readonly UserStatus[]): SQL | undefined {
  return or(...statuses.map((status) => STATUS_CONDITIONS[status]));
}
