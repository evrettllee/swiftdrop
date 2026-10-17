import { expect, type Page, test } from '@playwright/test';
import { HISTORY_TEXTS } from '../src/pages/courier-history/config/texts';
import { PAGINATION_TEXTS } from '../src/shared/config/texts';
import {
  APP_ROUTES,
  getCourierHistoryOrderPath,
  getCourierHistoryPath,
  HISTORY_PAGE_PARAM,
} from '../src/shared/routes/app-routes';
import { requireCourier, signInAsCourier } from './support/courier';
import {
  DESKTOP_VIEWPORT,
  HISTORY_PAGE_SIZE as PAGE_SIZE,
  HISTORY_TOTAL as TOTAL,
  historyCards,
  isHistoryUrl,
  NEWEST_ORDER_ID,
  openHistory,
  PHONE_VIEWPORT,
  stubHistory,
} from './support/courier-history';
import { waitForPath } from './support/courier-pages';

// The page of the history lives in the address (?page=N). The history comes from the stubbed API.
test.describe.configure({ mode: 'serial' });

let page: Page;

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
  page.removeAllListeners('request');
  await page.setViewportSize(DESKTOP_VIEWPORT);
  await stubHistory(page);
});

test('should open the page of the address and write the next one without piling up entries', async () => {
  await openHistory(page, getCourierHistoryPath(2));

  await expect(page.getByText(PAGINATION_TEXTS.range(6, 10, TOTAL))).toBeVisible();
  await expect(historyCards(page).first().getByRole('link')).toHaveAttribute(
    'href',
    getCourierHistoryOrderPath(NEWEST_ORDER_ID - PAGE_SIZE, 2),
  );

  const entries = await page.evaluate(() => history.length);
  await page.getByRole('button', { name: PAGINATION_TEXTS.NEXT }).click();

  await expect(page).toHaveURL(getCourierHistoryPath(3));
  expect(await page.evaluate(() => history.length)).toBe(entries);
});

test('should open the first page when the page of the address is not one of the history', async () => {
  for (const wrong of ['abc', '0', '-2', '99']) {
    await openHistory(page, `${APP_ROUTES.COURIER_HISTORY}?${HISTORY_PAGE_PARAM}=${wrong}`);

    await expect(page.getByText(PAGINATION_TEXTS.range(1, PAGE_SIZE, TOTAL))).toBeVisible();
    await expect(page).toHaveURL(getCourierHistoryPath(1));
  }
});

test('should ask a phone for all the pages up to the one of the address at once', async () => {
  await page.setViewportSize(PHONE_VIEWPORT);
  const searches: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());

    if (isHistoryUrl()(url)) {
      searches.push(url.search);
    }
  });

  await openHistory(page, getCourierHistoryPath(2));

  await expect(historyCards(page)).toHaveCount(2 * PAGE_SIZE);
  await expect(page.getByText(HISTORY_TEXTS.shown(2 * PAGE_SIZE, TOTAL))).toBeVisible();
  // The dev server runs an effect twice (StrictMode) and cancels the first request, so the same
  // request may be seen twice; what matters is that no other one was made.
  expect([...new Set(searches)]).toEqual([`?page=1&limit=${2 * PAGE_SIZE}`]);

  await page.getByRole('button', { name: HISTORY_TEXTS.SHOW_MORE }).click();

  await expect(historyCards(page)).toHaveCount(3 * PAGE_SIZE);
  await expect(page).toHaveURL(getCourierHistoryPath(3));
});
