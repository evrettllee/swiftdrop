import { expect, test } from '@playwright/test';
import { buildTelHref } from './phone';

test('should keep only the plus and the digits of a phone in the link', () => {
  expect(buildTelHref('+375 (29) 123-45-67')).toBe('tel:+375291234567');
});

test('should leave out everything a phone does not have, a scheme too', () => {
  expect(buildTelHref('javascript:alert(1)//+375291234567')).toBe('tel:1+375291234567');
  expect(buildTelHref('+375291234567?body=x&sms=1')).toBe('tel:+3752912345671');
});

test('should give no link when nothing of a phone is left', () => {
  expect(buildTelHref('')).toBeNull();
  expect(buildTelHref(' - () ')).toBeNull();
  expect(buildTelHref('нет телефона')).toBeNull();
});
