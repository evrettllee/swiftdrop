import { expect, test } from '@playwright/test';
import {
  formatDateRange,
  formatDateRangeWithYear,
  formatDayShort,
  formatMinskShortDateTime,
} from './analytics-format';
import { previousPeriodDates } from './analytics-range';

test('should calculate previous period and format calendar date ranges', () => {
  expect(previousPeriodDates('2026-11-06', '2026-11-12')).toEqual({
    from: '2026-10-30',
    to: '2026-11-05',
  });
  expect(formatDateRange('2026-11-06', '2026-11-12')).toBe('6–12 ноября');
  expect(formatDateRangeWithYear('2026-11-06', '2026-11-12')).toBe('6–12 ноября 2026');
  expect(formatDateRangeWithYear('2025-12-28', '2026-01-03')).toBe(
    '28 декабря 2025 г. – 3 января 2026 г.',
  );
  expect(formatDayShort('2026-11-06')).toBe('6 ноя');
});

test('should format UTC ISO timestamps in Europe/Minsk timezone', () => {
  expect(formatMinskShortDateTime('2026-11-10T13:40:00.000Z')).toBe('10 ноя, 16:40');
});
