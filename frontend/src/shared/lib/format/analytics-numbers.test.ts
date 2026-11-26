import { expect, test } from '@playwright/test';
import {
  changePercent,
  formatDecimal,
  formatDurationMinutes,
  formatDurationSeconds,
  formatSignedPercent,
  formatWhole,
  shareOf,
} from './analytics-numbers';

test('should format whole numbers, decimals, shares and signed percentages', () => {
  expect(formatWhole(4812).replace(/\u00a0/g, ' ')).toBe('4 812');
  expect(formatDecimal(15.42)).toBe('15,4');
  expect(shareOf(263, 289)).toBe(91);
  expect(shareOf(0, 0)).toBeNull();
  expect(changePercent(340, 315)).toBe(8);
  expect(changePercent(10, 0)).toBeNull();
  expect(formatSignedPercent(8)).toBe('+8%');
  expect(formatSignedPercent(-5)).toBe('-5%');
});

test('should format durations in seconds and minutes', () => {
  expect(formatDurationSeconds(110)).toBe('1 мин 50 с');
  expect(formatDurationSeconds(120)).toBe('2 мин');
  expect(formatDurationSeconds(45)).toBe('45 с');
  expect(formatDurationMinutes(34)).toBe('34 мин');
  expect(formatDurationMinutes(12.5)).toBe('12,5 мин');
});
