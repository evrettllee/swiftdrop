import { expect, test } from '@playwright/test';
import { ApiError } from '@/shared/api';
import { conflictFieldOf, hoursLeft, withConflictField } from './invite-errors';

const EMAIL_TAKEN = 'Пользователь с таким email уже зарегистрирован';
const PHONE_TAKEN = 'Пользователь с таким телефоном уже зарегистрирован';

test('should put the taken email under Email and the taken phone under Телефон', () => {
  expect(conflictFieldOf(EMAIL_TAKEN)).toBe('email');
  expect(conflictFieldOf(PHONE_TAKEN)).toBe('phone');
});

test('should leave an unknown conflict to the form', () => {
  expect(conflictFieldOf('Что-то пошло не так')).toBeNull();
});

test('should turn a 409 with a known text into a field error', () => {
  const error = withConflictField(new ApiError(409, PHONE_TAKEN));

  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).fieldErrors).toEqual([{ field: 'phone', message: PHONE_TAKEN }]);
});

test('should keep other errors as they are', () => {
  const throttled = new ApiError(429, 'Слишком много запросов');
  const unknownConflict = new ApiError(409, 'Другая причина');

  expect(withConflictField(throttled)).toBe(throttled);
  expect(withConflictField(unknownConflict)).toBe(unknownConflict);
  expect(withConflictField('boom')).toBe('boom');
});

test('should round the life of the link to hours', () => {
  const now = Date.UTC(2026, 10, 19, 10);

  expect(hoursLeft(new Date(now + 72 * 3_600_000 - 2_000), now)).toBe(72);
  expect(hoursLeft(new Date(now + 3_600_000), now)).toBe(1);
  expect(hoursLeft(new Date(now - 1_000), now)).toBe(0);
});
