import { expect, type Page, test } from '@playwright/test';
import { ORDER_STATUS_LABELS } from '../src/entities/order/config/texts';
import { HISTORY_TEXTS } from '../src/pages/courier-history/config/texts';
import type { CourierHistoryItem } from '../src/shared/api/endpoints/courier-history';
import { COURIER_ORDERS_API_PATHS } from '../src/shared/api/endpoints/courier-order';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { API_BASE_PATH, HTTP_STATUS } from '../src/shared/api/request-config';
import { PAGINATION_TEXTS } from '../src/shared/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { requireCourier, signInAsCourier } from './support/courier';
import { waitForPath } from './support/courier-pages';

// The history comes from the stubbed API: the seeded courier keeps the orders it has. One page
// signed in once serves all the tests.
test.describe.configure({ mode: 'serial' });

const TOTAL = 23;
const PAGE_SIZE = 5;
const NEWEST_ORDER_ID = 48213;
const DESKTOP_VIEWPORT = { width: 1440, height: 1000 };
const PHONE_VIEWPORT = { width: 375, height: 812 };
const SERVER_ERROR = 500;

let page: Page;

// An item as the backend sends it: the time is an ISO string.
type HistoryItemBody = Omit<CourierHistoryItem, 'finishedAt'> & { finishedAt: string | null };

// The history request of any page, or of the given one.
function isHistoryUrl(pageNumber?: number) {
  return (url: URL) =>
    url.pathname === `${API_BASE_PATH}${COURIER_ORDERS_API_PATHS.HISTORY}` &&
    (pageNumber === undefined || url.searchParams.get('page') === String(pageNumber));
}

function historyItem(index: number): HistoryItemBody {
  return {
    orderId: NEWEST_ORDER_ID - index,
    status: ORDER_STATUS.DELIVERED,
    finishedAt: new Date(Date.UTC(2026, 9, 12, 12, 2) - index * 3_600_000).toISOString(),
    pickup: { street: 'ул. Свердлова', house: '13а' },
    delivery: { street: 'пр-т Притыцкого', house: '83' },
    distanceKm: 7.98,
    weightKg: 2.5,
  };
}

// The backend pages `items` by the page and the limit of the request.
async function stubHistory(items: HistoryItemBody[]): Promise<void> {
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

function cards() {
  return page.getByRole('list', { name: HISTORY_TEXTS.LIST_LABEL }).getByRole('listitem');
}

async function openHistory(): Promise<void> {
  await page.goto(APP_ROUTES.COURIER_HISTORY);
  await expect(
    page.getByRole('heading', { level: 1, name: HISTORY_TEXTS.PAGE_TITLE }),
  ).toBeVisible();
}

test.beforeAll(async ({ browser }) => {
  requireCourier();
  page = await browser.newPage();
  await signInAsCourier(page);
  await waitForPath(page, APP_ROUTES.COURIER_WORK);
});

// The page is not opened when the courier is not given and the tests are skipped.
test.afterAll(async () => {
  await page?.close();
});

test.beforeEach(async () => {
  await page.unrouteAll();
  await page.setViewportSize(DESKTOP_VIEWPORT);
});

test('should page the history on the desktop', async () => {
  await stubHistory(Array.from({ length: TOTAL }, (_, index) => historyItem(index)));
  await openHistory();

  await expect(cards()).toHaveCount(PAGE_SIZE);
  await expect(page.getByText(PAGINATION_TEXTS.range(1, PAGE_SIZE, TOTAL))).toBeVisible();
  await expect(cards().first()).toContainText(`№${NEWEST_ORDER_ID}`);
  await expect(cards().first()).toContainText('ул. Свердлова, 13а');
  await expect(cards().first()).toContainText('7,98 км');
  await expect(cards().first()).toContainText('2,5 кг');
  await expect(cards().first()).toContainText(ORDER_STATUS_LABELS[ORDER_STATUS.DELIVERED]);

  await page.getByRole('button', { name: PAGINATION_TEXTS.NEXT }).click();

  await expect(page.getByText(PAGINATION_TEXTS.range(6, 10, TOTAL))).toBeVisible();
  await expect(page.getByText(PAGINATION_TEXTS.page(2, 5))).toBeVisible();
  await expect(cards()).toHaveCount(PAGE_SIZE);
  await expect(cards().first()).toContainText(`№${NEWEST_ORDER_ID - PAGE_SIZE}`);
});

test('should show more on a phone until the whole history is shown', async () => {
  await page.setViewportSize(PHONE_VIEWPORT);
  await stubHistory(Array.from({ length: TOTAL }, (_, index) => historyItem(index)));
  await openHistory();
  const showMore = page.getByRole('button', { name: HISTORY_TEXTS.SHOW_MORE });

  await expect(page.getByText(HISTORY_TEXTS.shown(PAGE_SIZE, TOTAL))).toBeVisible();
  await showMore.click();
  await expect(cards()).toHaveCount(2 * PAGE_SIZE);
  await expect(page.getByText(HISTORY_TEXTS.shown(2 * PAGE_SIZE, TOTAL))).toBeVisible();

  await showMore.click();
  await expect(cards()).toHaveCount(3 * PAGE_SIZE);
  await showMore.click();
  await expect(cards()).toHaveCount(4 * PAGE_SIZE);
  await showMore.click();

  await expect(cards()).toHaveCount(TOTAL);
  await expect(page.getByText(HISTORY_TEXTS.shown(TOTAL, TOTAL))).toBeVisible();
  await expect(showMore).toHaveCount(0);
});

test('should mark a cancelled order and open nothing from a card', async () => {
  await stubHistory([{ ...historyItem(0), status: ORDER_STATUS.CANCELLED }, historyItem(1)]);
  await openHistory();

  await expect(cards().first()).toContainText(ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED]);
  await expect(
    page.getByRole('list', { name: HISTORY_TEXTS.LIST_LABEL }).getByRole('link'),
  ).toHaveCount(0);
});

test('should offer to go to work when there are no deliveries yet', async () => {
  await stubHistory([]);
  await openHistory();

  await expect(page.getByRole('heading', { name: HISTORY_TEXTS.EMPTY_TITLE })).toBeVisible();
  await expect(page.getByRole('link', { name: HISTORY_TEXTS.TO_WORK })).toHaveAttribute(
    'href',
    APP_ROUTES.COURIER_WORK,
  );
});

test('should tell the failure and load the history again on retry', async () => {
  await page.route(isHistoryUrl(), (route) =>
    route.fulfill({ status: SERVER_ERROR, json: { message: 'Internal server error' } }),
  );
  await openHistory();

  await expect(page.getByRole('alert').filter({ hasText: HISTORY_TEXTS.LOAD_ERROR })).toBeVisible();

  await page.unrouteAll();
  await stubHistory([historyItem(0)]);
  await page.getByRole('button', { name: HISTORY_TEXTS.RETRY }).click();

  await expect(cards()).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('should keep the shown cards when the next page fails', async () => {
  await page.setViewportSize(PHONE_VIEWPORT);
  await stubHistory(Array.from({ length: TOTAL }, (_, index) => historyItem(index)));
  await openHistory();
  await expect(cards()).toHaveCount(PAGE_SIZE);

  await page.route(isHistoryUrl(2), (route) =>
    route.fulfill({ status: HTTP_STATUS.SERVICE_UNAVAILABLE, json: { message: 'Unavailable' } }),
  );
  await page.getByRole('button', { name: HISTORY_TEXTS.SHOW_MORE }).click();

  await expect(page.getByRole('alert').filter({ hasText: HISTORY_TEXTS.LOAD_ERROR })).toBeVisible();
  await expect(cards()).toHaveCount(PAGE_SIZE);
});
