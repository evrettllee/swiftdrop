import { expect, type Page, test } from '@playwright/test';
import { HISTORY_TEXTS } from '../src/pages/courier-history/config/texts';
import { PAGINATION_TEXTS } from '../src/shared/config/texts';
import {
  APP_ROUTES,
  getCourierHistoryOrderPath,
  getCourierHistoryPath,
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

test('should open the page of the address and step back to it after another one', async () => {
  await openHistory(page, getCourierHistoryPath('page=2'));

  await expect(page.getByText(PAGINATION_TEXTS.range(PAGE_SIZE + 1, TOTAL, TOTAL))).toBeVisible();
  await expect(historyCards(page).first().getByRole('link')).toHaveAttribute(
    'href',
    getCourierHistoryOrderPath(NEWEST_ORDER_ID - PAGE_SIZE, 'page=2'),
  );

  await page.getByRole('button', { name: PAGINATION_TEXTS.PREVIOUS }).click();
  await expect(page.getByText(PAGINATION_TEXTS.range(1, PAGE_SIZE, TOTAL))).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(getCourierHistoryPath('page=2'));
  await expect(page.getByText(PAGINATION_TEXTS.range(PAGE_SIZE + 1, TOTAL, TOTAL))).toBeVisible();
});

test('should open the first page when the page of the address is not one of the history', async () => {
  for (const wrong of ['abc', '0', '-2']) {
    await openHistory(page, `${APP_ROUTES.COURIER_HISTORY}?page=${wrong}`);

    await expect(page.getByText(PAGINATION_TEXTS.range(1, PAGE_SIZE, TOTAL))).toBeVisible();
  }
});

test('should start a phone at the top of the history by the cursor', async () => {
  await page.setViewportSize(PHONE_VIEWPORT);
  const cursors: (string | null)[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());

    if (isHistoryUrl()(url) && url.searchParams.get('limit') !== '1') {
      cursors.push(url.searchParams.get('cursor'));
    }
  });

  await openHistory(page, getCourierHistoryPath('page=2'));

  await expect(historyCards(page)).toHaveCount(PAGE_SIZE);
  await expect(page.getByText(HISTORY_TEXTS.shown(PAGE_SIZE, TOTAL))).toBeVisible();
  expect([...new Set(cursors)]).toEqual(['']);

  await page.getByRole('button', { name: HISTORY_TEXTS.SHOW_MORE }).click();

  await expect(historyCards(page)).toHaveCount(TOTAL);
  expect(cursors.at(-1)).toBe(String(PAGE_SIZE));
});
