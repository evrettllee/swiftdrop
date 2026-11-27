import { servicePayload, supportPayload, usersPayload } from './admin-analytics-ops-fixtures';

const DAY_MS = 24 * 60 * 60 * 1000;

function shift(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function datesBetween(from: string, to: string): string[] {
  const count = Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;

  return Array.from({ length: count }, (_, index) => shift(from, index));
}

export function businessPayload(from: string, to: string) {
  const days = datesBetween(from, to);
  const revenues = [612, 654, 729, 700, 588, 699, 830];
  const counts = [36, 39, 42, 45, 38, 47, 52];

  return {
    period: { from, to },
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
    revenueByDay: days.map((date, index) => ({
      date,
      revenue: revenues[index % revenues.length],
      delivered: counts[index % counts.length],
    })),
  };
}

export function deliveryPayload(from: string, to: string) {
  const days = datesBetween(from, to);
  const onTimes = [40, 38, 36, 41, 44, 39, 47];
  const totals = [43, 42, 41, 45, 47, 44, 52];

  return {
    period: { from, to },
    kpis: {
      onTimeRate: { value: { onTime: 263, total: 289 }, previous: { onTime: 240, total: 273 } },
      averageDeliveryMinutes: { value: 34, previous: 37 },
      autoAssignedRate: { value: { auto: 300, manual: 9 }, previous: { auto: 280, manual: 12 } },
      averageSearchSeconds: { value: 110, previous: 130 },
    },
    onTimeByDay: days.map((date, index) => ({
      date,
      onTime: onTimes[index % onTimes.length],
      total: totals[index % totals.length],
    })),
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
      {
        zoneId: 2,
        name: 'Минск, центр',
        orders: 61,
        onTime: 53,
        onTimeTotal: 61,
        averageDeliveryMinutes: 38,
        manualAssigned: 3,
        revenue: 1151,
      },
      {
        zoneId: 3,
        name: 'Боровляны',
        orders: 14,
        onTime: 13,
        onTimeTotal: 14,
        averageDeliveryMinutes: 41,
        manualAssigned: 1,
        revenue: 259,
      },
    ],
  };
}

export const adminAnalyticsBuilders = {
  business: businessPayload,
  delivery: deliveryPayload,
  users: (from: string, to: string) => usersPayload(from, to, datesBetween),
  support: (from: string, to: string) => supportPayload(from, to, datesBetween),
  service: (from: string, to: string) => servicePayload(from, to, datesBetween),
} as const;
