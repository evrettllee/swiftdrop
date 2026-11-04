import { expect, test } from '@playwright/test';
import type { AnalyticsKpis } from '@/shared/analytics-api';
import { kpiCards } from './kpi-cards';
import { changePercent, formatChange, searchTime } from './numbers';

const NBSP = ' ';

function kpis(overrides: Partial<AnalyticsKpis> = {}): AnalyticsKpis {
  return {
    delivered: {
      current: { delivered: 289, total: 312 },
      previous: { delivered: 268, total: 290 },
    },
    onTime: { current: { pct: 91, count: 263 }, previous: { pct: 90, count: 240 } },
    avgDeliveryMin: { current: 34, previous: 37 },
    cancelled: {
      current: { pct: 4.2, count: 13, by: { client: 9, system: 3, staff: 1 } },
      previous: { pct: 3, count: 9, by: { client: 9, system: 0, staff: 0 } },
    },
    revenue: {
      current: { total: '3184.20', avgCheck: '11.02', orders: 289 },
      previous: { total: '2950.00', avgCheck: '11.00', orders: 268 },
    },
    courierSearch: { current: { avgMin: 1.8, manual: 6 }, previous: { avgMin: 2, manual: 4 } },
    ...overrides,
  };
}

test('should count the change against the previous period and skip it without one', () => {
  expect(changePercent(289, 268)).toBe(8);
  expect(changePercent(90, 100)).toBe(-10);
  expect(changePercent(5, 5)).toBe(0);
  expect(changePercent(10, 0)).toBeNull();
  expect(changePercent(null, 10)).toBeNull();
  expect(changePercent(10, null)).toBeNull();
  expect([8, -10, 0].map(formatChange)).toEqual(['+8%', '-10%', '0%']);
});

test('should turn the minutes of the search into minutes and seconds', () => {
  expect(searchTime(1.8)).toEqual({ minutes: 1, seconds: 48 });
  expect(searchTime(0.5)).toEqual({ minutes: 0, seconds: 30 });
  expect(searchTime(3)).toEqual({ minutes: 3, seconds: 0 });
});

test('should write the six cards with the values and the notes of the design', () => {
  const cards = kpiCards(kpis());

  expect(cards.map((card) => [card.title, card.value, card.note])).toEqual([
    ['Доставлено', '289', 'из 312 оформленных, +8% к прошлому периоду'],
    ['Вовремя', '91%', '263 заказа к обещанному времени или раньше'],
    ['Среднее время доставки', '34 мин', 'от оплаты до вручения, было 37 мин'],
    ['Отменено', '4,2%', '13 заказов: 9 клиентом, 3 системой, 1 сотрудником'],
    ['Выручка', `3${NBSP}184 BYN`, 'средний чек 11,02 BYN, без возвратов'],
    ['Поиск курьера', '1 мин 48 с', 'в среднем, вручную назначено 6 заказов (2%)'],
  ]);
});

test('should give the phone the short titles, values and notes', () => {
  const cards = kpiCards(kpis());

  expect(cards.map((card) => [card.shortTitle, card.shortValue, card.shortNote])).toEqual([
    ['Доставлено', '289', 'из 312, +8% к прошлому периоду'],
    ['Вовремя', '91%', '263 к обещанному'],
    ['Время доставки', '34 мин', 'было 37 мин'],
    ['Отменено', '4,2%', '13 заказов'],
    ['Выручка', `3${NBSP}184 BYN`, 'чек 11,02 BYN'],
    ['Поиск курьера', '1:48', 'мин:с, вручную 2%'],
  ]);
});

test('should show a dash for empty values and leave out the parts without data', () => {
  const cards = kpiCards(
    kpis({
      delivered: { current: { delivered: 0, total: 0 }, previous: { delivered: 0, total: 0 } },
      onTime: { current: { pct: null, count: 0 }, previous: { pct: null, count: 0 } },
      avgDeliveryMin: { current: null, previous: null },
      cancelled: {
        current: { pct: null, count: 0, by: { client: 0, system: 0, staff: 0 } },
        previous: { pct: null, count: 0, by: { client: 0, system: 0, staff: 0 } },
      },
      revenue: {
        current: { total: '0.00', avgCheck: null, orders: 0 },
        previous: { total: '0.00', avgCheck: null, orders: 0 },
      },
      courierSearch: {
        current: { avgMin: null, manual: 0 },
        previous: { avgMin: null, manual: 0 },
      },
    }),
  );

  expect(cards.map((card) => [card.value, card.note])).toEqual([
    ['0', 'из 0 оформленных, нет данных за прошлый период'],
    ['—', '0 заказов к обещанному времени или раньше'],
    ['—', 'от оплаты до вручения'],
    ['—', '0 заказов'],
    ['0 BYN', 'средний чек —, без возвратов'],
    ['—', 'в среднем, вручную назначено 0 заказов'],
  ]);
  expect(cards[2].shortNote).toBe('нет данных за прошлый период');
  expect(cards[5].shortNote).toBe('мин:с');
});

test('should name only the reasons of cancelling that happened', () => {
  const [, , , cancelled] = kpiCards(
    kpis({
      cancelled: {
        current: { pct: 0.3, count: 1, by: { client: 0, system: 1, staff: 0 } },
        previous: { pct: 0, count: 0, by: { client: 0, system: 0, staff: 0 } },
      },
    }),
  );

  expect(cancelled.note).toBe('1 заказ: 1 системой');
});
