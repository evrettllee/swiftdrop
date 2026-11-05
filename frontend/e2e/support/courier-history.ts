import { expect, type Page, type Route } from '@playwright/test';
import { HISTORY_TEXTS } from '../../src/pages/courier-history/config/texts';
import type { CourierHistoryItem } from '../../src/shared/api/endpoints/courier-history';
import { COURIER_ORDERS_API_PATHS } from '../../src/shared/api/endpoints/courier-order';
import { ORDER_STATUS } from '../../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { CALENDAR_PERIOD, calendarPeriod } from '../../src/shared/lib/calendar/period';
import { LIST_PAGE_SIZE } from '../../src/shared/lib/list-params/page-size';
import { APP_ROUTES } from '../../src/shared/routes/app-routes';

export const HISTORY_TOTAL = 23;
export const HISTORY_PAGE_SIZE = LIST_PAGE_SIZE;
export const NEWEST_ORDER_ID = 48213;
export const DESKTOP_VIEWPORT = { width: 1440, height: 1000 };
export const PHONE_VIEWPORT = { width: 375, height: 812 };

const MINUTE_MS = 60_000;
const MINSK_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Minsk',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export type HistoryItemBody = Omit<CourierHistoryItem, 'finishedAt'> & {
  finishedAt: string | null;
};

export function thisMonday(): string {
  return calendarPeriod(CALENDAR_PERIOD.THIS_WEEK, new Date()).from ?? '';
}

export function isHistoryUrl(pageNumber?: number) {
  return (url: URL) =>
    url.pathname === `${API_BASE_PATH}${COURIER_ORDERS_API_PATHS.HISTORY}` &&
    (pageNumber === undefined || url.searchParams.get('page') === String(pageNumber));
}

export function isNextCursorUrl() {
  return (url: URL) => isHistoryUrl()(url) && (url.searchParams.get('cursor') ?? '') !== '';
}

export function historyItem(index: number, finishedAt?: Date): HistoryItemBody {
  const monday = Date.parse(`${thisMonday()}T09:00:00Z`);

  return {
    orderId: NEWEST_ORDER_ID - index,
    status: ORDER_STATUS.DELIVERED,
    finishedAt: (
      finishedAt ?? new Date(monday + (HISTORY_TOTAL - index) * MINUTE_MS)
    ).toISOString(),
    pickup: { street: 'ул. Свердлова', house: '13а' },
    delivery: { street: 'пр-т Притыцкого', house: '83' },
    distanceKm: 7.98,
    weightKg: 2.5,
  };
}

export function fullHistory(): HistoryItemBody[] {
  return Array.from({ length: HISTORY_TOTAL }, (_, index) => historyItem(index));
}

function matches(item: HistoryItemBody, params: URLSearchParams): boolean {
  const day = MINSK_DAY.format(new Date(item.finishedAt ?? 0));
  const q = params.get('q');
  const from = params.get('from');
  const to = params.get('to');
  const until = params.get('until');

  return (
    (q === null || item.orderId === Number(q)) &&
    (from === null || day >= from) &&
    (to === null || day <= to) &&
    (until === null || item.orderId <= Number(until))
  );
}

function sortValue(item: HistoryItemBody, key: string): number {
  return key === 'distanceKm' ? item.distanceKm : Date.parse(item.finishedAt ?? '');
}

function sorted(items: HistoryItemBody[], sort: string | null): HistoryItemBody[] {
  const [key, direction] = (sort ?? 'finishedAt:desc').split(':');
  const sign = direction === 'asc' ? 1 : -1;

  return items.toSorted(
    (a, b) => sign * (sortValue(a, key) - sortValue(b, key) || a.orderId - b.orderId),
  );
}

function summaryOf(items: HistoryItemBody[]) {
  const delivered = items.filter((item) => item.status === ORDER_STATUS.DELIVERED);
  const km = delivered.reduce((sum, item) => sum + item.distanceKm, 0);

  return { count: delivered.length, distanceKm: Math.round(km * 10) / 10 };
}

export type HistoryStub = { items: HistoryItemBody[]; requests: URLSearchParams[] };

function answer(stub: HistoryStub, route: Route) {
  const params = new URL(route.request().url()).searchParams;
  stub.requests.push(params);
  const found = sorted(
    stub.items.filter((item) => matches(item, params)),
    params.get('sort'),
  );
  const limit = Number(params.get('limit') ?? '10');
  const cursor = params.get('cursor');

  if (cursor === null) {
    const page = Number(params.get('page') ?? '1');
    const top = found.length === 0 ? null : Math.max(...found.map((item) => item.orderId));

    return route.fulfill({
      json: {
        items: found.slice((page - 1) * limit, page * limit),
        page,
        limit,
        total: found.length,
        until: params.has('until') ? Number(params.get('until')) : top,
        summary: summaryOf(found),
      },
    });
  }

  const offset = cursor === '' ? 0 : Number(cursor);
  const end = offset + limit;

  return route.fulfill({
    json: {
      items: found.slice(offset, end),
      nextCursor: end < found.length ? String(end) : null,
      ...(cursor === '' ? { total: found.length, summary: summaryOf(found) } : {}),
    },
  });
}

export async function stubHistory(
  page: Page,
  items: HistoryItemBody[] = fullHistory(),
): Promise<HistoryStub> {
  const stub: HistoryStub = { items, requests: [] };
  await page.route(isHistoryUrl(), (route) => answer(stub, route));

  return stub;
}

export function historyCards(page: Page) {
  return page.getByRole('list', { name: HISTORY_TEXTS.LIST_LABEL }).getByRole('listitem');
}

export async function openHistory(
  page: Page,
  path: string = APP_ROUTES.COURIER_HISTORY,
): Promise<void> {
  await page.goto(path);
  await expect(
    page.getByRole('heading', { level: 1, name: HISTORY_TEXTS.PAGE_TITLE }),
  ).toBeVisible();
}

export function lastListRequest(stub: HistoryStub): URLSearchParams | undefined {
  return stub.requests.filter((params) => params.get('limit') !== '1').at(-1);
}
