import { expect, type Page, test } from '@playwright/test';
import { ORDER_COURIER_TEXTS, ORDER_POLL_INTERVAL_MS } from '../src/pages/order/config/tracking';
import { AUTH_API_PATHS } from '../src/shared/api/endpoints/auth';
import { ORDER_STATUS, type OrderStatus } from '../src/shared/api/endpoints/order';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { getOrderPath } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { MAP_TEXTS } from '../src/shared/ui/route-map/map';
import { stubMapbox } from './support/mapbox';
import {
  buildTestOrderDetails,
  COURIER_NAME,
  COURIER_PHONE_DIGITS,
  DELIVERY_CODE,
  stubOrderCourier,
} from './support/order-details';
import { PARCEL_SEGMENT, stubRouteLines } from './support/routing';

// The client has no socket: the page asks for the order again by itself. The session, the order,
// the courier and the route come from the stubbed API, and the clock of the page is the test's.
const ORDER_ID = 990005;
const TEST_CLIENT = {
  userId: 990005,
  firstName: 'Анна',
  lastName: 'Тестова',
  email: 'order-tracking@example.com',
  phone: null,
  role: ROLE.CLIENT,
};

let status: OrderStatus;
let orderRequests: number;
let isOrderFailing: boolean;

test.beforeEach(async ({ page }) => {
  status = ORDER_STATUS.CONFIRMED;
  orderRequests = 0;
  isOrderFailing = false;
  await page.clock.install();
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.clientOrder(ORDER_ID), () => [PARCEL_SEGMENT]);
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.ME}`, (route) =>
    route.fulfill({ json: TEST_CLIENT }),
  );
  await page.route(`**${API_BASE_PATH}/orders/${ORDER_ID}`, (route) => {
    orderRequests += 1;

    return isOrderFailing
      ? route.fulfill({ status: 500, json: { message: 'Failure' } })
      : route.fulfill({ json: buildTestOrderDetails(ORDER_ID, status) });
  });
  await stubOrderCourier(page, ORDER_ID, () => status);
});

function heading(page: Page, name: string) {
  return page.getByRole('heading', { name, exact: true });
}

function codeGroup(page: Page) {
  return page.getByRole('group', { name: 'Код 4 8 2 7' });
}

async function openOrder(page: Page): Promise<void> {
  await page.goto(getOrderPath(ORDER_ID));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

// The next tick of the polling of the page.
function tick(page: Page): Promise<void> {
  return page.clock.runFor(ORDER_POLL_INTERVAL_MS);
}

async function setTabHidden(page: Page, isHidden: boolean): Promise<void> {
  await page.evaluate((hidden) => {
    Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });
    Object.defineProperty(document, 'visibilityState', {
      value: hidden ? 'hidden' : 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  }, isHidden);
}

test('should search for a courier with a pulse on the pickup point while the order is confirmed', async ({
  page,
}) => {
  await openOrder(page);

  await expect(page.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toBeVisible();
  const map = page.getByRole('region', { name: MAP_TEXTS.VIEW_LABEL });
  await expect(map.locator('.position-marker__pulse')).toHaveCount(2);
  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toHaveCount(0);
  await expect(codeGroup(page)).toHaveCount(0);
});

test('should show the courier without a phone and without a code once one is assigned', async ({
  page,
}) => {
  status = ORDER_STATUS.COURIER_ASSIGNED;
  await openOrder(page);

  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toBeVisible();
  await expect(page.getByText(COURIER_NAME)).toBeVisible();
  await expect(page.getByText('Легковой, Skoda Octavia, 1234 AB-7')).toBeVisible();
  await expect(page.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toHaveCount(0);
  await expect(page.locator('.position-marker__pulse')).toHaveCount(0);
  await expect(codeGroup(page)).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(COURIER_PHONE_DIGITS);
});

test('should show the code for the courier once the parcel is picked up, off the live regions', async ({
  page,
}) => {
  status = ORDER_STATUS.PICKED_UP;
  await openOrder(page);

  await expect(heading(page, ORDER_COURIER_TEXTS.CODE_SECTION)).toBeVisible();
  await expect(codeGroup(page)).toHaveText(DELIVERY_CODE);
  await expect(page.getByRole('button', { name: 'Отменить заказ' })).toHaveCount(0);
  await expect(
    page.locator('[aria-live] [aria-label^="Код"], [role="status"] [aria-label^="Код"]'),
  ).toHaveCount(0);
});

test('should follow the order from the search to the pickup without a reload', async ({ page }) => {
  await openOrder(page);
  await page.evaluate(() => Object.assign(window, { stayedOnPage: true }));
  await expect(page.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toBeVisible();

  status = ORDER_STATUS.COURIER_ASSIGNED;
  await tick(page);
  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toBeVisible();
  await expect(page.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: 'Курьер назначен' })).not.toHaveCount(0);

  status = ORDER_STATUS.PICKED_UP;
  await tick(page);
  await expect(codeGroup(page)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отменить заказ' })).toHaveCount(0);
  expect(await page.evaluate(() => 'stayedOnPage' in window)).toBe(true);
});

test('should keep the page and stay quiet when a poll fails', async ({ page }) => {
  status = ORDER_STATUS.COURIER_ASSIGNED;
  await openOrder(page);

  const asked = orderRequests;
  isOrderFailing = true;
  await tick(page);

  await expect.poll(() => orderRequests).toBeGreaterThan(asked);
  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('should stop asking once the order is delivered', async ({ page }) => {
  status = ORDER_STATUS.DELIVERED;
  await openOrder(page);
  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toBeVisible();
  const asked = orderRequests;

  await page.clock.runFor(3 * ORDER_POLL_INTERVAL_MS);

  expect(orderRequests).toBe(asked);
});

test('should pause on a hidden tab and ask at once on return', async ({ page }) => {
  status = ORDER_STATUS.COURIER_ASSIGNED;
  await openOrder(page);
  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toBeVisible();

  await setTabHidden(page, true);
  const asked = orderRequests;
  await page.clock.runFor(3 * ORDER_POLL_INTERVAL_MS);
  expect(orderRequests).toBe(asked);

  await setTabHidden(page, false);

  await expect.poll(() => orderRequests).toBeGreaterThan(asked);
});
