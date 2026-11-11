import { expect, test } from '@playwright/test';
import { summaryLine } from './summary-line';

const NOW = new Date('2026-10-28T09:00:00.000Z');

function plain(value: string | undefined): string | undefined {
  return value?.replaceAll(/\s/gu, ' ');
}

function text(line: ReturnType<typeof summaryLine>): string | null {
  return line === null ? null : (plain(`${line.lead}${line.count}, ${line.distance}`) ?? null);
}

test('should name the week of the mockup with the deliveries and the kilometres', () => {
  const line = summaryLine(
    { from: '2026-10-20', to: '2026-10-26' },
    { count: 23, distanceKm: 112 },
    NOW,
  );

  expect(text(line)).toBe('20–26 октября: 23 доставки, 112 км');
});

test('should decline the deliveries by their number', () => {
  const period = { from: '2026-10-01', to: '2026-10-31' };

  expect(text(summaryLine(period, { count: 1, distanceKm: 7.9 }, NOW))).toBe(
    '1–31 октября: 1 доставка, 7,9 км',
  );
  expect(text(summaryLine(period, { count: 5, distanceKm: 40.5 }, NOW))).toBe(
    '1–31 октября: 5 доставок, 40,5 км',
  );
});

test('should name the months of a period across two of them', () => {
  const line = summaryLine(
    { from: '2026-10-27', to: '2026-11-02' },
    { count: 2, distanceKm: 9 },
    NOW,
  );

  expect(text(line)).toBe('27 октября – 2 ноября: 2 доставки, 9 км');
});

test('should add the year to a period of another year', () => {
  const line = summaryLine(
    { from: '2025-12-29', to: '2026-01-04' },
    { count: 3, distanceKm: 12 },
    NOW,
  );

  expect(plain(line?.lead)).toBe('29 декабря 2025 г. – 4 января 2026 г.: ');
});

test('should sum the whole time and an open period', () => {
  const summary = { count: 128, distanceKm: 1043.2 };

  expect(text(summaryLine({ from: null, to: null }, summary, NOW))).toBe(
    'Всего: 128 доставок, 1 043,2 км',
  );
  expect(plain(summaryLine({ from: '2026-10-01', to: null }, summary, NOW)?.lead)).toBe(
    'С 1 октября: ',
  );
  expect(plain(summaryLine({ from: null, to: '2026-10-15' }, summary, NOW)?.lead)).toBe(
    'По 15 октября: ',
  );
});

test('should show no summary without deliveries', () => {
  expect(summaryLine({ from: null, to: null }, { count: 0, distanceKm: 0 }, NOW)).toBeNull();
  expect(summaryLine({ from: null, to: null }, null, NOW)).toBeNull();
});
