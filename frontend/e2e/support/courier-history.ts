import { expect, type Page } from '@playwright/test';
import { HISTORY_TEXTS } from '../../src/pages/courier-history/config/texts';
import type { CourierHistoryItem } from '../../src/shared/api/endpoints/courier-history';
import { COURIER_ORDERS_API_PATHS } from '../../src/shared/api/endpoints/courier-order';
import { ORDER_STATUS } from '../../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../../src/shared/api/request-config';
import { APP_ROUTES } from '../../src/shared/routes/app-routes';

export const HISTORY_TOTAL = 23;
export const HISTORY_PAGE_SIZE = 5;
export const NEWEST_ORDER_ID = 48213;
export const DESKTOP_VIEWPORT = { width: 1440, height: 1000 };
export const PHONE_VIEWPORT = { width: 375, height: 812 };

const FINISHED_AT = Date.UTC(2026, 9, 12, 12, 2);
const HOUR_MS = 3_600_000;

// An item as the backend sends it: the time is an ISO string.
export type HistoryItemBody = Omit<CourierHistoryItem, 'finishedAt'> & {
  finishedAt: string | null;
};

// The history request of any page, or of the given one.
export function isHistoryUrl(pageNumber?: number) {
  return (url: URL) =>
    url.pathname === `${API_BASE_PATH}${COURIER_ORDERS_API_PATHS.HISTORY}` &&
    (pageNumber === undefined || url.searchParams.get('page') === String(pageNumber));
}

export function historyItem(index: number): HistoryItemBody {
  return {
    orderId: NEWEST_ORDER_ID - index,
    status: ORDER_STATUS.DELIVERED,
    finishedAt: new Date(FINISHED_AT - index * HOUR_MS).toISOString(),
    pickup: { street: 'ул. Свердлова', house: '13а' },
    delivery: { street: 'пр-т Притыцкого', house: '83' },
    distanceKm: 7.98,
    weightKg: 2.5,
  };
}

export function fullHistory(): HistoryItemBody[] {
  return Array.from({ length: HISTORY_TOTAL }, (_, index) => historyItem(index));
}

// The backend pages `items` by the page and the limit of the request.
export async function stubHistory(
  page: Page,
  items: HistoryItemBody[] = fullHistory(),
): Promise<void> {
  await page.route(isHistoryUrl(), (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get('page'));
    const limit = Number(url.searchParams.get('limit'));
    const start = (pageNumber - 1) * limit;

    return route.fulfill({
      json: {
        items: items.slice(start, start + limit),
        page: pageNumber,
        limit,
        total: items.length,
      },
    });
  });
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
