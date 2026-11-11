import { expect, type Page, test } from '@playwright/test';
import { ORDER_STATUS_LABELS } from '../src/entities/order/config/texts';
import { HISTORY_TEXTS } from '../src/pages/courier-history/config/texts';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { HTTP_STATUS } from '../src/shared/api/request-config';
import { PAGINATION_TEXTS } from '../src/shared/config/texts';
import { APP_ROUTES, getCourierHistoryOrderPath } from '../src/shared/routes/app-routes';
import { requireCourier, signInAsCourier } from './support/courier';
import {
  DESKTOP_VIEWPORT,
  HISTORY_PAGE_SIZE as PAGE_SIZE,
  HISTORY_TOTAL as TOTAL,
  historyCards,
  historyItem,
  isHistoryUrl,
  isNextCursorUrl,
  NEWEST_ORDER_ID,
  openHistory,
  PHONE_VIEWPORT,
  stubHistory,
} from './support/courier-history';
import { waitForPath } from './support/courier-pages';

// The history comes from the stubbed API: the seeded courier keeps the orders it has. One page
// signed in once serves all the tests.
test.describe.configure({ mode: 'serial' });

let page: Page;

function cards() {
  return historyCards(page);
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
  await stubHistory(page);
  await openHistory(page);

  await expect(cards()).toHaveCount(PAGE_SIZE);
  await expect(page.getByText(PAGINATION_TEXTS.range(1, PAGE_SIZE, TOTAL))).toBeVisible();
  await expect(cards().first()).toContainText(`№${NEWEST_ORDER_ID}`);
  await expect(cards().first()).toContainText('ул. Свердлова, 13а');
  await expect(cards().first()).toContainText('7,98 км');
  await expect(cards().first()).toContainText('2,5 кг');
  await expect(cards().first()).toContainText(ORDER_STATUS_LABELS[ORDER_STATUS.DELIVERED]);

  await page.getByRole('button', { name: PAGINATION_TEXTS.NEXT }).click();

  await expect(page.getByText(PAGINATION_TEXTS.range(PAGE_SIZE + 1, TOTAL, TOTAL))).toBeVisible();
  await expect(
    page.getByText(PAGINATION_TEXTS.page(2, Math.ceil(TOTAL / PAGE_SIZE))),
  ).toBeVisible();
  await expect(cards()).toHaveCount(TOTAL - PAGE_SIZE);
  await expect(cards().first()).toContainText(`№${NEWEST_ORDER_ID - PAGE_SIZE}`);
});

test('should show more on a phone until the whole history is shown', async () => {
  await page.setViewportSize(PHONE_VIEWPORT);
  await stubHistory(page);
  await openHistory(page);
  const showMore = page.getByRole('button', { name: HISTORY_TEXTS.SHOW_MORE });

  await expect(page.getByText(HISTORY_TEXTS.shown(PAGE_SIZE, TOTAL))).toBeVisible();
  await expect(cards()).toHaveCount(PAGE_SIZE);
  await showMore.click();

  await expect(cards()).toHaveCount(TOTAL);
  await expect(showMore).toHaveCount(0);
});

test('should mark a cancelled order and link every card to its order', async () => {
  await stubHistory(page, [{ ...historyItem(0), status: ORDER_STATUS.CANCELLED }, historyItem(1)]);
  await openHistory(page);

  await expect(cards().first()).toContainText(ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED]);
  await expect(cards().first().getByRole('link')).toHaveAttribute(
    'href',
    getCourierHistoryOrderPath(NEWEST_ORDER_ID),
  );
  await expect(cards().nth(1).getByRole('link')).toHaveAttribute(
    'href',
    getCourierHistoryOrderPath(NEWEST_ORDER_ID - 1),
  );
});

test('should offer to go to work when there are no deliveries yet', async () => {
  await stubHistory(page, []);
  await openHistory(page);

  await expect(page.getByRole('heading', { name: HISTORY_TEXTS.EMPTY_TITLE })).toBeVisible();
  await expect(page.getByRole('link', { name: HISTORY_TEXTS.TO_WORK })).toHaveAttribute(
    'href',
    APP_ROUTES.COURIER_WORK,
  );
});

test('should tell the failure and load the history again on retry', async () => {
  await page.route(isHistoryUrl(), (route) =>
    route.fulfill({ status: 500, json: { message: 'Internal server error' } }),
  );
  await openHistory(page);

  await expect(page.getByRole('alert').filter({ hasText: HISTORY_TEXTS.LOAD_ERROR })).toBeVisible();

  await page.unrouteAll();
  await stubHistory(page, [historyItem(0)]);
  await page.getByRole('button', { name: HISTORY_TEXTS.RETRY }).click();

  await expect(cards()).toHaveCount(1);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('should keep the shown cards when the next page fails', async () => {
  await page.setViewportSize(PHONE_VIEWPORT);
  await stubHistory(page);
  await openHistory(page);
  await expect(cards()).toHaveCount(PAGE_SIZE);

  await page.route(isNextCursorUrl(), (route) =>
    route.fulfill({ status: HTTP_STATUS.SERVICE_UNAVAILABLE, json: { message: 'Unavailable' } }),
  );
  await page.getByRole('button', { name: HISTORY_TEXTS.SHOW_MORE }).click();

  await expect(page.getByRole('alert').filter({ hasText: HISTORY_TEXTS.LOAD_ERROR })).toBeVisible();
  await expect(cards()).toHaveCount(PAGE_SIZE);
});
