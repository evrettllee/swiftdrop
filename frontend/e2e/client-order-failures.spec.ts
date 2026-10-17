import { expect, type Page, test } from '@playwright/test';
import { ORDER_DETAILS_TEXTS } from '../src/pages/order/config/texts';
import { ORDER_COURIER_TEXTS } from '../src/pages/order/config/tracking';
import { AUTH_API_PATHS } from '../src/shared/api/endpoints/auth';
import { ORDER_STATUS, type OrderStatus } from '../src/shared/api/endpoints/order';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { getOrderPath } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { stubMapbox } from './support/mapbox';
import { buildTestOrderDetails, stubOrderCourier } from './support/order-details';
import { PARCEL_SEGMENT, stubRouteLines } from './support/routing';

// How the order page of a client behaves when a request fails or is refused. The session, the
// order, the courier and the route come from the stubbed API, the clock of the page is the test's.
const ORDER_ID = 990006;
const TEST_CLIENT = {
  userId: 990006,
  firstName: 'Анна',
  lastName: 'Тестова',
  email: 'order-failures@example.com',
  phone: null,
  role: ROLE.CLIENT,
};

let status: OrderStatus;
let orderFailure: number | null;

test.beforeEach(async ({ page }) => {
  status = ORDER_STATUS.CONFIRMED;
  orderFailure = null;
  await page.clock.install();
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.clientOrder(ORDER_ID), () => [PARCEL_SEGMENT]);
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.ME}`, (route) =>
    route.fulfill({ json: TEST_CLIENT }),
  );
  await page.route(`**${API_BASE_PATH}/orders/${ORDER_ID}`, (route) =>
    orderFailure === null
      ? route.fulfill({ json: buildTestOrderDetails(ORDER_ID, status) })
      : route.fulfill({ status: orderFailure, json: { message: 'Failure' } }),
  );
  await stubOrderCourier(page, ORDER_ID, () => status);
});

function heading(page: Page, name: string) {
  return page.getByRole('heading', { name, exact: true });
}

async function openOrder(page: Page): Promise<void> {
  await page.goto(getOrderPath(ORDER_ID));
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

// A forbidden order looks like a missing one: the page does not tell that the order exists.
test('should say the order is not found when the backend answers 403', async ({ page }) => {
  orderFailure = 403;

  await page.goto(getOrderPath(ORDER_ID));

  await expect(heading(page, ORDER_DETAILS_TEXTS.NOT_FOUND_TITLE)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

// The courier of the order is asked for again quietly when the first request failed.
const COURIER_PATH = `${API_BASE_PATH}/orders/${ORDER_ID}/courier`;
const COURIER_RETRY_WAIT_MS = 10_000;
const HTTP_OK = 200;

// The next answers of the courier request, one status for each request; the stub of the test
// answers the rest. Returns the number of the requests made.
async function answerCourierWith(page: Page, statuses: number[]): Promise<{ count: number }> {
  const requests = { count: 0 };

  await page.route(`**${COURIER_PATH}`, (route) => {
    const next = statuses[requests.count];
    requests.count += 1;

    return next === undefined || next === HTTP_OK
      ? route.fallback()
      : route.fulfill({ status: next, json: { message: 'Failure' } });
  });

  return requests;
}

test('should ask for the courier again when the first request failed on a delivered order', async ({
  page,
}) => {
  status = ORDER_STATUS.DELIVERED;
  const requests = await answerCourierWith(page, [500]);
  await openOrder(page);
  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toHaveCount(0);

  await page.clock.runFor(COURIER_RETRY_WAIT_MS);

  await expect(heading(page, ORDER_COURIER_TEXTS.SECTION)).toBeVisible();
  expect(requests.count).toBe(2);
});

test('should ask for the courier of a delivered order once more at most', async ({ page }) => {
  status = ORDER_STATUS.DELIVERED;
  const requests = await answerCourierWith(page, [500, 500, 500]);
  await openOrder(page);

  // The repeat is set when the first answer has come: the clock moves until it has been made.
  await expect
    .poll(async () => {
      await page.clock.runFor(COURIER_RETRY_WAIT_MS);

      return requests.count;
    })
    .toBe(2);
  await page.clock.runFor(3 * COURIER_RETRY_WAIT_MS);

  expect(requests.count).toBe(2);
});

test('should not ask for the courier again when the backend refuses the request', async ({
  page,
}) => {
  status = ORDER_STATUS.DELIVERED;
  const requests = await answerCourierWith(page, [404, 404]);
  await openOrder(page);
  await expect.poll(() => requests.count).toBe(1);

  await page.clock.runFor(3 * COURIER_RETRY_WAIT_MS);

  expect(requests.count).toBe(1);
});
