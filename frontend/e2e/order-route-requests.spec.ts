import { expect, type Page, test } from '@playwright/test';
import { AUTH_API_PATHS } from '../src/shared/api/endpoints/auth';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { API_BASE_PATH, HTTP_STATUS } from '../src/shared/api/request-config';
import { ROUTE_REFRESH_INTERVAL_MS, ROUTE_RETRY_MS } from '../src/shared/lib/route-lines/config';
import { getOrderPath } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { MAP_CLASS, MAP_TEXTS } from '../src/shared/ui/route-map/map';
import { stubMapbox } from './support/mapbox';
import { stubOrderDetails } from './support/order-details';
import {
  expectRoadLines,
  PARCEL_SEGMENT,
  routeUnavailableBadge,
  stubRouteLines,
} from './support/routing';

// How often the map of an order asks for its route. The session, the order and its route all come
// from the stubbed API: nothing here needs the backend, and no client is registered, as the
// registration is rate-limited.
const ORDER_ID = 990004;
// Longer than both the retry and the refresh, so a repeated request would have come.
const QUIET_WAIT_MS = Math.max(ROUTE_RETRY_MS, ROUTE_REFRESH_INTERVAL_MS) + 3_000;
const TEST_CLIENT = {
  userId: 990004,
  firstName: 'Анна',
  lastName: 'Тестова',
  email: 'route-requests@example.com',
  phone: null,
  role: ROLE.CLIENT,
};

test.beforeEach(async ({ page }) => {
  test.setTimeout(QUIET_WAIT_MS * 3);
  await stubMapbox(page);
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.ME}`, (route) =>
    route.fulfill({ json: TEST_CLIENT }),
  );
});

function orderMap(page: Page) {
  return page.getByRole('region', { name: MAP_TEXTS.VIEW_LABEL });
}

test('should ask for the route of an order without a courier once, without polling', async ({
  page,
}) => {
  await stubOrderDetails(page, ORDER_ID, ORDER_STATUS.CONFIRMED);
  const requests = await stubRouteLines(page, ROUTING_API_PATHS.clientOrder(ORDER_ID), () => [
    PARCEL_SEGMENT,
  ]);

  await page.goto(getOrderPath(ORDER_ID));
  await expectRoadLines(orderMap(page), 1);
  // The development build runs an effect twice: the first request may be sent and dropped.
  const answered = requests.length;
  await page.waitForTimeout(QUIET_WAIT_MS);

  expect(requests).toHaveLength(answered);
});

test('should show the points alone and not ask again when the route is not found', async ({
  page,
}) => {
  await stubOrderDetails(page, ORDER_ID);
  let requests = 0;
  await page.route(`**${API_BASE_PATH}${ROUTING_API_PATHS.clientOrder(ORDER_ID)}`, (route) => {
    requests += 1;

    return route.fulfill({ status: HTTP_STATUS.NOT_FOUND, json: { message: 'Заказ не найден' } });
  });

  await page.goto(getOrderPath(ORDER_ID));
  await expect(orderMap(page).locator(`.${MAP_CLASS.MARKER}`)).toHaveCount(2);
  await expect.poll(() => requests).toBeGreaterThan(0);
  const answered = requests;
  await page.waitForTimeout(QUIET_WAIT_MS);

  await expect(routeUnavailableBadge(orderMap(page))).toHaveCount(0);
  await expectRoadLines(orderMap(page), 0);
  expect(requests).toBe(answered);
});
