import { expect, test } from '@playwright/test';
import { ORDERS_PARAMS_CONFIG, type OrdersParams } from '../config/list-params';
import { shortPersonName, waitingMinutes, isLongWait } from '../lib/order-row';
import { calendarToday } from '@/shared/lib/calendar';
import { detectPreset, presetPeriod } from '../lib/period';
import { appliedFilters, emptyResultText, exportScope } from './applied-filters';
import { toOrdersView } from './orders-view';

const NOW = new Date('2026-10-26T21:30:00Z');

function params(patch: Partial<OrdersParams> = {}): OrdersParams {
  return { ...ORDERS_PARAMS_CONFIG.defaults, ...patch };
}

test('should take the date of Minsk for the periods', () => {
  expect(calendarToday(NOW)).toBe('2026-10-27');
  expect(presetPeriod('week', NOW)).toEqual({ from: '2026-10-21', to: null });
  expect(detectPreset({ from: '2026-09-28', to: null }, NOW)).toBe('month');
  expect(detectPreset({ from: '2026-10-21', to: '2026-10-27' }, NOW)).toBe('custom');
});

test('should sort the attention tab by the waiting time unless another sort is chosen', () => {
  expect(toOrdersView(params({ status: 'attention' })).sort).toBe('statusChangedAt:asc');
  expect(toOrdersView(params()).sort).toBe('createdAt:desc');
  expect(toOrdersView(params({ sort: 'statusChangedAt:asc' })).sort).toBe('createdAt:desc');
  expect(toOrdersView(params({ status: 'attention', sort: 'price:asc' })).sort).toBe('price:asc');
});

test('should send a text search from three letters and a number from one digit', () => {
  expect(toOrdersView(params({ q: 'Ли' })).filter.search).toBeNull();
  expect(toOrdersView(params({ q: 'Лис' })).filter.search).toBe('Лис');
  expect(toOrdersView(params({ q: '4' })).filter.search).toBe('4');
});

test('should drop a period that ends before it starts', () => {
  const view = toOrdersView(params({ from: '2026-10-20', to: '2026-10-01' }));

  expect(view.filter.from).toBeNull();
  expect(view.hasFilters).toBe(false);
});

test('should name the applied filters for the chips and the export', () => {
  const view = toOrdersView(
    params({ from: '2026-10-21', courierId: 7, payment: ['paid', 'refunded'], fragile: true }),
  );
  const chips = appliedFilters(view.filter, NOW, null);

  expect(view.filtersCount).toBe(4);
  expect(chips.map((chip) => `${chip.name}: ${chip.value}`)).toEqual([
    'Период: 7 дней',
    'Курьер: Курьер №7',
    'Оплата: оплачен, деньги возвращены',
    'Посылка: только хрупкие',
  ]);
  expect(exportScope(view, chips.slice(0, 1))).toEqual(['все', '7 дней']);
});

test('should explain an empty result by the search and the period', () => {
  expect(emptyResultText(toOrdersView(params({ q: '48299', from: '2026-10-21' })), NOW)).toBe(
    'По номеру «48299» за последние 7 дней заказов нет. Проверьте номер или измените фильтры.',
  );
  expect(emptyResultText(toOrdersView(params({ fragile: true })), NOW)).toBe(
    'По выбранным фильтрам заказов нет. Измените фильтры.',
  );
});

test('should shorten the name of a courier and count the waiting minutes', () => {
  expect(shortPersonName('Павел Новиков')).toBe('Павел Н.');
  expect(shortPersonName('Алина')).toBe('Алина');
  expect(waitingMinutes(new Date(NOW.getTime() - 35 * 60_000 - 5_000), NOW.getTime())).toBe(35);
  expect(isLongWait(new Date(NOW.getTime() - 14 * 60_000), NOW.getTime())).toBe(false);
  expect(isLongWait(new Date(NOW.getTime() - 15 * 60_000), NOW.getTime())).toBe(true);
});
