import { ROLE } from '@/common/enums/role.enum';
import { USER_STATUS } from '../constants/admin-users.constants';
import type { UserStatusFacts } from '../types/admin-users.types';
import { deriveUserStatus } from './user-status';

const ACTIVE_FACTS: UserStatusFacts = {
  roleName: ROLE.COURIER,
  isBlocked: false,
  deletedAt: null,
  hasPassword: true,
  lastLoginAt: new Date(),
};

const NEVER_SIGNED_IN = { hasPassword: false, lastLoginAt: null };

describe('deriveUserStatus', () => {
  it('should call a user deleted when deleted_at is set, even if blocked', () => {
    expect(deriveUserStatus({ ...ACTIVE_FACTS, deletedAt: new Date(), isBlocked: true })).toBe(
      USER_STATUS.DELETED,
    );
  });

  it('should call a user blocked when the account is blocked and not deleted', () => {
    expect(deriveUserStatus({ ...ACTIVE_FACTS, isBlocked: true, ...NEVER_SIGNED_IN })).toBe(
      USER_STATUS.BLOCKED,
    );
  });

  it.each([ROLE.COURIER, ROLE.MANAGER])(
    'should call a %s invited when they have no password and never signed in',
    (roleName) => {
      expect(deriveUserStatus({ ...ACTIVE_FACTS, roleName, ...NEVER_SIGNED_IN })).toBe(
        USER_STATUS.INVITED,
      );
    },
  );

  it('should never call a client invited when the client has no password and never signed in', () => {
    expect(deriveUserStatus({ ...ACTIVE_FACTS, roleName: ROLE.CLIENT, ...NEVER_SIGNED_IN })).toBe(
      USER_STATUS.ACTIVE,
    );
  });

  it.each([
    ['has a password', { hasPassword: true, lastLoginAt: null }],
    ['has signed in', { hasPassword: false, lastLoginAt: new Date() }],
  ])('should call staff active when the account %s', (_case, facts) => {
    expect(deriveUserStatus({ ...ACTIVE_FACTS, ...facts })).toBe(USER_STATUS.ACTIVE);
  });
});
