import { expect, test } from '@playwright/test';
import { AUTH_STATUS, ROLE } from '@/shared/session';
import { isSessionOwnerChanged, type SessionState } from './session-owner';

function user(userId: number): NonNullable<SessionState['user']> {
  return {
    userId,
    firstName: 'Анна',
    lastName: 'Тестова',
    email: 'a@example.com',
    phone: null,
    role: ROLE.CLIENT,
  };
}

const SIGNED_IN = { status: AUTH_STATUS.AUTHENTICATED, user: user(7) };
const GUEST = { status: AUTH_STATUS.GUEST, user: null };
const LOADING = { status: AUTH_STATUS.LOADING, user: null };

test('should drop the data of the user on sign-out and on another account', () => {
  expect(isSessionOwnerChanged(SIGNED_IN, GUEST)).toBe(true);
  expect(isSessionOwnerChanged(SIGNED_IN, { ...SIGNED_IN, user: user(8) })).toBe(true);
});

test('should keep the data when the same user stays or a guest signs in', () => {
  expect(isSessionOwnerChanged(SIGNED_IN, { ...SIGNED_IN, user: user(7) })).toBe(false);
  expect(isSessionOwnerChanged(GUEST, SIGNED_IN)).toBe(false);
  expect(isSessionOwnerChanged(LOADING, SIGNED_IN)).toBe(false);
});
