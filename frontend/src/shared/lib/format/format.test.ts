import { expect, test } from '@playwright/test';
import { formatShortDate, formatShortDay } from './format';

test('should write every short month with three letters', () => {
  const months = Array.from({ length: 12 }, (_, month) => formatShortDay(new Date(2026, month, 6)));

  expect(months).toEqual([
    '6 янв',
    '6 фев',
    '6 мар',
    '6 апр',
    '6 мая',
    '6 июн',
    '6 июл',
    '6 авг',
    '6 сен',
    '6 окт',
    '6 ноя',
    '6 дек',
  ]);
});

test('should add the year to the short date', () => {
  expect(formatShortDate(new Date(2026, 10, 12, 12))).toBe('12 ноя 2026');
});
