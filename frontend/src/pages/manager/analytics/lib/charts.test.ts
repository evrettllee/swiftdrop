import { expect, test } from '@playwright/test';
import { ANALYTICS_PERIOD } from '../config/analytics';
import { dayBars } from './chart-bars';
import { daysSummary } from './days';
import { hoursSummary, hoursWindow } from './hours';
import { formatDateRange, resolvePeriod } from './period';
import { labelStep, niceScale } from './scale';

function hours(values: Record<number, number>) {
  return Array.from({ length: 24 }, (_, hour) => ({ hour, avgOrders: values[hour] ?? 0 }));
}

test('should build the Y scale from steps of 1, 2 and 5 times a power of ten', () => {
  expect(niceScale(58, 4)).toEqual({ top: 80, ticks: [0, 20, 40, 60, 80] });
  expect(niceScale(40, 4)).toEqual({ top: 40, ticks: [0, 10, 20, 30, 40] });
  expect(niceScale(5.1, 4)).toEqual({ top: 8, ticks: [0, 2, 4, 6, 8] });
  expect(niceScale(0.9, 4)).toEqual({ top: 2, ticks: [0, 0.5, 1, 1.5, 2] });
  expect(niceScale(0.3, 4)).toEqual({ top: 0.4, ticks: [0, 0.1, 0.2, 0.3, 0.4] });
  expect(niceScale(7, 4)).toEqual({ top: 8, ticks: [0, 2, 4, 6, 8] });
  expect(niceScale(0, 4)).toEqual({ top: 4, ticks: [0, 1, 2, 3, 4] });
});

test('should show the hours from the first to the last busy one, but at least 8 to 22', () => {
  expect(hoursWindow(hours({ 12: 1 })).map((hour) => hour.hour)).toEqual(
    Array.from({ length: 15 }, (_, index) => index + 8),
  );
  const wide = hoursWindow(hours({ 6: 0.5, 23: 0.2 })).map((hour) => hour.hour);
  expect([wide[0], wide.at(-1), wide.length]).toEqual([6, 23, 18]);
  expect(hoursWindow(hours({})).length).toBe(15);
});

test('should sum the hours up for a screen reader', () => {
  expect(hoursSummary(hoursWindow(hours({ 8: 1, 18: 5.1, 21: 2, 22: 0.9 })))).toBe(
    'Нагрузка по часам: пик в 18 часов, 5,1 заказа в час; меньше всего в 9 часов, 0',
  );
  expect(hoursSummary(hoursWindow(hours({ 21: 1, 22: 3 })))).toBe(
    'Нагрузка по часам: пик в 22 часа, 3 заказа в час; меньше всего в 8 часов, 0',
  );
  expect(hoursSummary(hoursWindow(hours({})))).toBe('Нагрузка по часам: заказов не было');
});

test('should sum the days up and thin out the date labels of a long period', () => {
  const days = [
    { date: '2026-10-25', delivered: 50, cancelled: 2, inProgress: 0 },
    { date: '2026-10-26', delivered: 22, cancelled: 0, inProgress: 10 },
  ];

  expect(daysSummary(days)).toBe(
    'Заказы по дням: 25 октября доставлено 50, отменено 2; 26 октября доставлено 22, отменено 0, в работе 10',
  );
  expect(dayBars(days, true).map((bar) => bar.axisLabel)).toEqual(['25 окт', '26 окт']);
  expect(dayBars(days, false).map((bar) => bar.axisLabel)).toEqual(['25', '26']);
  expect([labelStep(7, 7), labelStep(30, 7), labelStep(90, 7), labelStep(30, 10)]).toEqual([
    1, 5, 13, 3,
  ]);
});

test('should read the period from the address and refuse a custom one longer than 92 days', () => {
  const week = resolvePeriod({ period: ANALYTICS_PERIOD.WEEK, from: null, to: null }, '2026-10-26');
  expect(week.query).toEqual({ from: '2026-10-20', to: '2026-10-26' });
  const quarter = resolvePeriod(
    { period: ANALYTICS_PERIOD.QUARTER, from: null, to: null },
    '2026-10-26',
  );
  expect(quarter.query?.from).toBe('2026-07-29');

  const custom = (from: string | null, to: string | null) =>
    resolvePeriod({ period: ANALYTICS_PERIOD.CUSTOM, from, to }, '2026-10-26');
  expect(custom('2026-08-01', '2026-10-31')).toEqual({
    query: { from: '2026-08-01', to: '2026-10-31' },
    error: null,
  });
  expect(custom('2026-07-31', '2026-10-31').error).toBe('Период — не больше 92 дней');
  expect(custom('2026-10-27', '2026-10-26').error).toBe('Начало периода позже его конца');
  expect(custom(null, '2026-10-26').error).toBe('Укажите обе даты периода');
});

test('should write the range of a period in words', () => {
  expect(formatDateRange('2026-10-20', '2026-10-26')).toBe('20–26 октября');
  expect(formatDateRange('2026-09-28', '2026-10-04')).toBe('28 сентября – 4 октября');
  expect(formatDateRange('2026-10-26', '2026-10-26')).toBe('26 октября');
  expect(formatDateRange('2026-12-30', '2027-01-05')).toMatch(/^30 декабря 2026.* – 5 января 2027/);
});
