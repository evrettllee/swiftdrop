import { expect, test } from '@playwright/test';
import { buildServiceTabView } from './service-view';
import { buildSupportTabView } from './support-view';
import { buildUsersTabView } from './users-view';

test('should scale distribution bars by max bucket and keep active share percentage in users view', () => {
  const view = buildUsersTabView(
    {
      period: { from: '2026-11-06', to: '2026-11-12' },
      kpis: {
        newClients: { value: 64, previous: 52 },
        activeClients: { value: 211, previous: 190 },
        repeatClients: {
          value: { repeat: 80, active: 211 },
          previous: { repeat: 67, active: 190 },
        },
        couriersOnline: { onShift: 14, total: 37 },
        averageDeliveriesPerCourier: { value: 21, previous: 19 },
      },
      newClientsByDay: [{ date: '2026-11-12', count: 13 }],
      ordersPerClient: { one: 131, two: 46, threeToFive: 27, sixPlus: 7 },
    },
    false,
  );

  expect(view.kpis[0].change?.text).toContain('к прошлому периоду');
  expect(view.kpis[3].value).toBe('14 из 37');
  expect(view.ordersPerClient[0]).toMatchObject({ barWidthPct: 100, sharePct: 62 });
  expect(view.ordersPerClient[1]).toMatchObject({ barWidthPct: 35, sharePct: 22 });
});

test('should map support topics with v0.7.0 labels and format minsk mail failures in service view', () => {
  const support = buildSupportTabView({
    period: { from: '2026-11-06', to: '2026-11-12' },
    kpis: {
      ticketsCreated: { value: 27, previous: 31 },
      firstResponseMedianMinutes: { value: 12, previous: 15 },
      closed: { value: { closed: 23, total: 27 }, previous: { closed: 24, total: 31 } },
      unansweredNow: { count: 2, longestWaitMinutes: 18 },
    },
    topics: [{ topic: 'order_problem', count: 11 }],
    firstResponseByDay: [{ date: '2026-11-10', medianMinutes: 18, tickets: 6 }],
  });

  expect(support.kpis[0].change).toEqual({
    direction: 'down',
    tone: 'positive',
    text: 'было 31',
  });
  expect(support.topics[0].label).toBe('Проблема с заказом');

  const service = buildServiceTabView({
    period: { from: '2026-11-06', to: '2026-11-12' },
    kpis: {
      serverErrors: { value: 12, previous: 4 },
      externalFailures: {
        value: { failures: 7, services: 4 },
        previous: { failures: 9, services: 4 },
      },
      mailFailures: { count: 1, lastAt: '2026-11-10T13:40:00.000Z' },
      savedRateUsed: 2,
    },
    serverErrorsByDay: [{ date: '2026-11-11', count: 5 }],
    services: [
      { service: 'osrm', failures: 3, lastAt: '2026-11-12T11:20:00.000Z', lastCode: 'timeout' },
    ],
    recent: [
      {
        lastAt: '2026-11-12T11:20:00.000Z',
        firstAt: '2026-11-12T11:18:00.000Z',
        service: 'osrm',
        code: 'timeout',
        message: 'upstream timeout 5000ms',
        repeats: 3,
      },
    ],
  });

  expect(service.kpis[0].change).toEqual({ direction: 'up', tone: 'negative', text: 'было 4' });
  expect(service.kpis[2].change?.text).toBe('последнее 10 ноя, 16:40');
  expect(service.recent[0]).toMatchObject({
    time: '12 ноя, 14:20',
    whatHappened: 'Сервис маршрутов не ответил вовремя',
    tooltip: 'upstream timeout 5000ms',
  });
});
