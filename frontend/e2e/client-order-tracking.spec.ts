import { expect, type Page, test } from '@playwright/test';
import { ORDER_COURIER_TEXTS } from '../src/pages/order/config/tracking';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { MAP_TEXTS } from '../src/shared/ui/route-map/map';
import {
  LIVE_ORDER_ID,
  type LiveOrder,
  openLiveOrder,
  pushStatus,
  stubLiveOrder,
} from './support/live-order';
import { COURIER_NAME, DELIVERY_CODE } from './support/order-details';

// The page follows the order with the events of its room: no polling.
// Long enough for the polling of before (every 10 seconds) to have asked twice.
const QUIET_WAIT_MS = 25_000;

let order: LiveOrder;

test.beforeEach(async ({ page }) => {
  order = await stubLiveOrder(page);
});

function heading(page: Page, name: string) {
  return page.getByRole('heading', { name, exact: true });
}

function codeGroup(page: Page) {
  return page.getByRole('group', { name: 'Код 4 8 2 7' });
}

test('should search for a courier with a pulse on the pickup point while the order is confirmed', async ({
  page,
}) => {
  await openLiveOrder(page, order);

  await expect(page.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toBeVisible();
  const map = page.getByRole('region', { name: MAP_TEXTS.VIEW_LABEL });
  await expect(map.locator('.position-marker__pulse')).toHaveCount(2);
  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toHaveCount(0);
  await expect(codeGroup(page)).toHaveCount(0);
});

test('should show the courier and no code once one is assigned', async ({ page }) => {
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  await openLiveOrder(page, order);

  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toBeVisible();
  await expect(page.getByText(COURIER_NAME)).toBeVisible();
  await expect(page.getByText('Легковой, Skoda Octavia, 1234 AB-7')).toBeVisible();
  await expect(page.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toHaveCount(0);
  await expect(page.locator('.position-marker__pulse')).toHaveCount(0);
  await expect(codeGroup(page)).toHaveCount(0);
});

test('should show the code for the courier once the parcel is picked up, off the live regions', async ({
  page,
}) => {
  order.status = ORDER_STATUS.PICKED_UP;
  await openLiveOrder(page, order);

  await expect(heading(page, ORDER_COURIER_TEXTS.CODE_SECTION)).toBeVisible();
  await expect(codeGroup(page)).toHaveText(DELIVERY_CODE);
  await expect(page.getByRole('button', { name: 'Отменить заказ' })).toHaveCount(0);
  await expect(
    page.locator('[aria-live] [aria-label^="Код"], [role="status"] [aria-label^="Код"]'),
  ).toHaveCount(0);
});

test('should follow the order from the search to the pickup with the events of its room', async ({
  page,
}) => {
  await openLiveOrder(page, order);
  await page.evaluate(() => Object.assign(window, { stayedOnPage: true }));
  await expect(page.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toBeVisible();

  pushStatus(order, LIVE_ORDER_ID, ORDER_STATUS.COURIER_ASSIGNED);
  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toBeVisible();
  await expect(page.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'Курьер назначен' })).not.toHaveCount(0);

  pushStatus(order, LIVE_ORDER_ID, ORDER_STATUS.PICKED_UP);
  await expect(codeGroup(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отменить заказ' })).toHaveCount(0);
  expect(await page.evaluate(() => 'stayedOnPage' in window)).toBe(true);
});

test('should keep the page and stay quiet when the order fails to load after an event', async ({
  page,
}) => {
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  await openLiveOrder(page, order);
  const asked = order.requests;
  order.isFailing = true;

  pushStatus(order, LIVE_ORDER_ID, ORDER_STATUS.PICKED_UP);

  await expect.poll(() => order.requests).toBeGreaterThan(asked);
  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('should ask for nothing by itself while no event comes', async ({ page }) => {
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  await openLiveOrder(page, order);
  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toBeVisible();
  const asked = order.requests;

  await page.waitForTimeout(QUIET_WAIT_MS);

  expect(order.requests).toBe(asked);
});
