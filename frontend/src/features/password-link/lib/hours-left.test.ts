import { expect, test } from '@playwright/test';
import { PASSWORD_LINK_TEXTS } from '../config/texts';
import { hoursLeft } from './hours-left';

test('should round the life of the link to hours', () => {
  const now = Date.UTC(2026, 10, 19, 10);

  expect(hoursLeft(new Date(now + 72 * 3_600_000 - 2_000), now)).toBe(72);
  expect(hoursLeft(new Date(now + 3_600_000), now)).toBe(1);
  expect(hoursLeft(new Date(now - 1_000), now)).toBe(0);
});

test('should name the hours in the right form', () => {
  expect(PASSWORD_LINK_TEXTS.hours(72)).toBe('72 часа');
  expect(PASSWORD_LINK_TEXTS.hours(1)).toBe('1 час');
  expect(PASSWORD_LINK_TEXTS.hours(5)).toBe('5 часов');
});
