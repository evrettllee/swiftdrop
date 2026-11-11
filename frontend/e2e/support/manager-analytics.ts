import type { Page, Route } from '@playwright/test';
import { openAsManager } from './manager';

const SUMMARY_URL = /\/api\/manager\/analytics\/summary(\?.*)?$/;
const COURIERS_URL = /\/api\/manager\/analytics\/couriers(\?.*)?$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export const ANALYTICS_PATH = '/manager/analytics';
export const COURIERS_PATH = '/manager/analytics/couriers';
export const ANALYTICS_NOW = new Date('2026-10-26T12:00:00.000Z');

const WEEK = [
  [36, 2, 0],
  [39, 2, 0],
  [42, 2, 0],
  [45, 2, 0],
  [55, 3, 0],
  [50, 2, 0],
  [22, 0, 10],
];

const HOURS = [0.9, 1.8, 2.5, 3, 4.3, 3.9, 3.2, 2.9, 3.3, 4.5, 5.1, 4.2, 2.9, 1.8, 0.9];

const NAMES = [
  ['Дмитрий Соколов', 'car'],
  ['Алина Гордей', 'scooter'],
  ['Павел Новик', 'bicycle'],
  ['Андрей Король', 'car'],
  ['Марина Лобач', 'bicycle'],
] as const;

export type AnalyticsStub = {
  summaries: URLSearchParams[];
  couriers: URLSearchParams[];
  failure: number | null;
};

function shift(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function daysOf(from: string, to: string) {
  const count = Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;

  return Array.from({ length: count }, (_, index) => {
    const [delivered, cancelled, inProgress] =
      count === WEEK.length ? WEEK[index] : [20 + ((index * 7) % 30), index % 3, 0];

    return { date: shift(from, index), delivered, cancelled, inProgress };
  });
}

function summaryOf(search: URLSearchParams) {
  const to = search.get('to') ?? '2026-10-26';
  const from = search.get('from') ?? shift(to, -6);
  const days = daysOf(from, to);
  const length = days.length;

  return {
    period: { from, to, previousFrom: shift(from, -length), previousTo: shift(from, -1) },
    kpis: {
      delivered: {
        current: { delivered: 289, total: 312 },
        previous: { delivered: 268, total: 290 },
      },
      onTime: { current: { pct: 91, count: 263 }, previous: { pct: 89.5, count: 240 } },
      avgDeliveryMin: { current: 34, previous: 37 },
      cancelled: {
        current: { pct: 4.2, count: 13, by: { client: 9, system: 3, staff: 1 } },
        previous: { pct: 3.1, count: 9, by: { client: 6, system: 3, staff: 0 } },
      },
      revenue: {
        current: { total: '3184.40', avgCheck: '11.02', orders: 289 },
        previous: { total: '2950.00', avgCheck: '11.01', orders: 268 },
      },
      courierSearch: { current: { avgMin: 1.8, manual: 6 }, previous: { avgMin: 2.1, manual: 4 } },
    },
    days,
    hours: Array.from({ length: 24 }, (_, hour) => ({ hour, avgOrders: HOURS[hour - 8] ?? 0 })),
  };
}

export function rawCouriers() {
  return Array.from({ length: 23 }, (_, index) => {
    const [name, vehicleType] = NAMES[index] ?? [`Курьер ${index + 1}`, 'bicycle'];

    return {
      courierId: index + 1,
      name,
      vehicleType,
      delivered: [46, 41, 37, 35, 30][index] ?? 29 - index,
      onTimePct: index === 22 ? null : ([93, 95, 89, 91, 90][index] ?? 80 + (index % 10)),
      avgDeliveryMin: index === 22 ? null : ([31, 29, 36, 33, 35][index] ?? 30 + (index % 7)),
      declinedOffers: [2, 1, 4, 0, 3][index] ?? index % 5,
      hoursOnline: [38, 35, 34, 30, 28][index] ?? 20 + (index % 8) / 2,
    };
  });
}

type RawCourier = ReturnType<typeof rawCouriers>[number];

function couriersOf(search: URLSearchParams) {
  const [key, direction] = (search.get('sort') ?? 'delivered:desc').split(':') as [
    keyof RawCourier,
    string,
  ];
  const sign = direction === 'asc' ? 1 : -1;
  const sorted = rawCouriers().toSorted((left, right) => {
    const [a, b] = [left[key] ?? -1, right[key] ?? -1];

    return (a < b ? -1 : a > b ? 1 : left.courierId - right.courierId) * sign;
  });
  const page = Number(search.get('page') ?? '1');
  const limit = Number(search.get('limit') ?? '20');

  return {
    items: sorted.slice((page - 1) * limit, page * limit),
    total: sorted.length,
    page,
    limit,
    period: { from: search.get('from'), to: search.get('to') },
  };
}

function answer(stub: AnalyticsStub, route: Route, body: () => unknown) {
  return stub.failure === null
    ? route.fulfill({ json: body() })
    : route.fulfill({
        status: stub.failure,
        json: { message: 'Слишком много запросов аналитики. Подождите минуту' },
      });
}

export async function stubAnalytics(page: Page): Promise<AnalyticsStub> {
  const stub: AnalyticsStub = { summaries: [], couriers: [], failure: null };
  await openAsManager(page);
  await page.clock.setFixedTime(ANALYTICS_NOW);

  await page.route(SUMMARY_URL, (route) => {
    const search = new URL(route.request().url()).searchParams;
    stub.summaries.push(search);

    return answer(stub, route, () => summaryOf(search));
  });
  await page.route(COURIERS_URL, (route) => {
    const search = new URL(route.request().url()).searchParams;
    stub.couriers.push(search);

    return answer(stub, route, () => couriersOf(search));
  });

  return stub;
}

export function periodOf(search: URLSearchParams | undefined): string {
  return `${search?.get('from')}..${search?.get('to')}`;
}

export async function cardLines(page: Page, id: string): Promise<string[]> {
  const text = await page
    .getByRole('region', { name: 'Ключевые показатели' })
    .locator(`[data-kpi="${id}"]`)
    .innerText();

  return text.split('\n').filter((line) => line.trim() !== '');
}
