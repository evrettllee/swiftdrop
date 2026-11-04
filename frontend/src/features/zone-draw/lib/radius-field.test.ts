import { expect, test } from '@playwright/test';
import { formatRadiusField, parseRadiusKm } from './radius-field';

test('should read the radius with a comma or a dot to a tenth of a kilometre', () => {
  expect(parseRadiusKm('3')).toBe(3);
  expect(parseRadiusKm('2,54')).toBe(2.5);
  expect(parseRadiusKm(' 0.1 ')).toBe(0.1);
  expect(parseRadiusKm('50')).toBe(50);
});

test('should refuse a radius out of 0,1–50 km or not a number', () => {
  expect(parseRadiusKm('0.04')).toBeNull();
  expect(parseRadiusKm('50.1')).toBeNull();
  expect(parseRadiusKm('')).toBeNull();
  expect(parseRadiusKm('abc')).toBeNull();
});

test('should write the radius without trailing zeros', () => {
  expect(formatRadiusField(3)).toBe('3');
  expect(formatRadiusField(3.04)).toBe('3');
  expect(formatRadiusField(2.46)).toBe('2,5');
});
