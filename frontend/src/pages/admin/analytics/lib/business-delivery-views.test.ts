import { expect, test } from '@playwright/test';
import { buildBusinessTabView } from './business-view';
import { buildDeliveryTabView } from './delivery-view';

test('should build business view with semantic kpi polarity and four loss rows', () => {
  const view = buildBusinessTabView(
    {
      period: { from: '2026-11-06', to: '2026-11-12' },
      kpis: {
        ordersCreated: { value: 340, previous: 315 },
        revenue: { value: 4812, previous: 4335 },
        averageCheck: { value: 15.42, previous: 14.9 },
        refunds: { value: { amount: 41.2, orders: 3 }, previous: { amount: 20, orders: 2 } },
      },
      funnel: { created: 340, paid: 318, courierAssigned: 309, delivered: 289 },
      losses: {
        unpaidExpired: 17,
        cancelledBeforePayment: 5,
        cancelledAfterPayment: { client: 9, system: 3, staff: 1 },
        inProgress: 16,
      },
      revenueByDay: [{ date: '2026-11-12', revenue: 830, delivered: 52 }],
    },
    true,
  );

  expect(view.kpis[0].change).toEqual({
    direction: 'up',
    tone: 'positive',
    text: '+8% к прошлой неделе',
  });
  expect(view.kpis[3].change?.tone).toBe('negative');
  expect(view.losses.map((item) => item.count)).toEqual([17, 5, 13, 16]);
  expect(view.funnel.map((stage) => stage.sharePct)).toEqual([100, 94, 91, 85]);
});

test('should sort Без зоны last in delivery zones and invert time kpi polarity', () => {
  const view = buildDeliveryTabView({
    period: { from: '2026-11-06', to: '2026-11-12' },
    kpis: {
      onTimeRate: { value: { onTime: 263, total: 289 }, previous: { onTime: 240, total: 273 } },
      averageDeliveryMinutes: { value: 34, previous: 37 },
      autoAssignedRate: { value: { auto: 300, manual: 9 }, previous: { auto: 280, manual: 12 } },
      averageSearchSeconds: { value: 110, previous: 130 },
    },
    onTimeByDay: [{ date: '2026-11-12', onTime: 47, total: 52 }],
    offers: {
      accepted: 402,
      declined: 46,
      expired: 67,
      total: 515,
      orders: 309,
      maxDeclinesBeforeManual: 5,
    },
    zones: [
      {
        zoneId: null,
        name: 'Без зоны',
        orders: 500,
        onTime: 400,
        onTimeTotal: 500,
        averageDeliveryMinutes: 40,
        manualAssigned: 1,
        revenue: 900,
      },
      {
        zoneId: 2,
        name: 'Боровляны',
        orders: 14,
        onTime: 13,
        onTimeTotal: 14,
        averageDeliveryMinutes: 41,
        manualAssigned: 1,
        revenue: 259,
      },
      {
        zoneId: 1,
        name: 'Минск',
        orders: 214,
        onTime: 197,
        onTimeTotal: 214,
        averageDeliveryMinutes: 33,
        manualAssigned: 5,
        revenue: 3402,
      },
    ],
  });

  expect(view.kpis[1].change).toEqual({
    direction: 'down',
    tone: 'positive',
    text: 'от оплаты до вручения, было 37',
  });
  expect(view.kpis[3].value).toBe('1 мин 50 с');
  expect(view.zones.map((zone) => zone.name)).toEqual(['Минск', 'Боровляны', 'Без зоны']);
});
