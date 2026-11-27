import { expect, test } from '@playwright/test';
import {
  serviceAnalyticsSchema,
  supportAnalyticsSchema,
  usersAnalyticsSchema,
} from './admin-analytics-ops-schemas';
import { businessAnalyticsSchema, deliveryAnalyticsSchema } from './admin-analytics-schemas';

test('should parse business, delivery, users, support and service admin analytics payloads', () => {
  expect(() =>
    businessAnalyticsSchema.parse({
      period: { from: '2026-11-06', to: '2026-11-12' },
      kpis: {
        ordersCreated: { value: 340, previous: 315 },
        revenue: { value: 4812, previous: 4335 },
        averageCheck: { value: 15.42, previous: 14.9 },
        refunds: { value: { amount: 41.2, orders: 3 }, previous: { amount: 28, orders: 2 } },
      },
      funnel: { created: 340, paid: 318, courierAssigned: 309, delivered: 289 },
      losses: {
        unpaidExpired: 17,
        cancelledBeforePayment: 5,
        cancelledAfterPayment: { client: 9, system: 3, staff: 1 },
        inProgress: 16,
      },
      revenueByDay: [{ date: '2026-11-12', revenue: 830, delivered: 52 }],
    }),
  ).not.toThrow();

  expect(() =>
    deliveryAnalyticsSchema.parse({
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
          orders: 4,
          onTime: 3,
          onTimeTotal: 4,
          averageDeliveryMinutes: 42,
          manualAssigned: 1,
          revenue: 56,
        },
      ],
    }),
  ).not.toThrow();

  expect(() =>
    usersAnalyticsSchema.parse({
      period: { from: '2026-11-06', to: '2026-11-12' },
      kpis: {
        newClients: { value: 64, previous: 52 },
        activeClients: { value: 211, previous: 190 },
        repeatClients: {
          value: { repeat: 80, active: 211 },
          previous: { repeat: 67, active: 190 },
        },
        couriersOnline: { onShift: 14, total: 37 },
        averageDeliveriesPerCourier: { value: 21, previous: 19.5 },
      },
      newClientsByDay: [{ date: '2026-11-12', count: 13 }],
      ordersPerClient: { one: 131, two: 46, threeToFive: 27, sixPlus: 7 },
    }),
  ).not.toThrow();

  expect(() =>
    supportAnalyticsSchema.parse({
      period: { from: '2026-11-06', to: '2026-11-12' },
      kpis: {
        ticketsCreated: { value: 27, previous: 31 },
        firstResponseMedianMinutes: { value: 12, previous: 15 },
        closed: { value: { closed: 23, total: 27 }, previous: { closed: 24, total: 31 } },
        unansweredNow: { count: 2, longestWaitMinutes: 18 },
      },
      topics: [{ topic: 'order_problem', count: 11 }],
      firstResponseByDay: [{ date: '2026-11-10', medianMinutes: 18, tickets: 6 }],
    }),
  ).not.toThrow();

  expect(() =>
    serviceAnalyticsSchema.parse({
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
          message: 'timeout after 5000ms',
          repeats: 3,
        },
      ],
    }),
  ).not.toThrow();
});
