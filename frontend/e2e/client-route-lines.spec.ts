import { expect, type Page, test } from '@playwright/test';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { ROUTE_RETRY_MS } from '../src/shared/lib/route-lines/config';
import { getOrderPath } from '../src/shared/routes/app-routes';
import { MAP_CLASS, MAP_TEXTS } from '../src/shared/ui/route-map/map';
import { registerClient } from './support/client';
import { stubMapbox, TEST_ADDRESSES } from './support/mapbox';
import { stubOrderDetails } from './support/order-details';
import { chooseCalculatorRoute, chooseCheckoutRoute } from './support/route-pages';
import {
  COURIER_SEGMENT,
  expectRoadLines,
  expectTagsInside,
  PARCEL_SEGMENT,
  routeUnavailableBadge,
  stubClientOrderRoute,
  stubRouteLines,
  withoutLines,
} from './support/routing';

// The routes come from the stubbed API. One client signed in once serves all the tests: the
// registration of the backend is rate-limited.
test.describe.configure({ mode: 'serial' });

// The order comes from the stubbed API as well: its map is what the tests look at.
const ORDER_ID = 990002;
// The retry comes after ROUTE_RETRY_MS; the margin is for the request and the drawing.
const RETRY_WAIT_MS = ROUTE_RETRY_MS + 5_000;
const { SVERDLOVA, PRITYTSKOGO } = TEST_ADDRESSES;

let page: Page;

async function openOrder() {
  await stubOrderDetails(page, ORDER_ID);
  await page.goto(getOrderPath(ORDER_ID));

  return page.getByRole('region', { name: MAP_TEXTS.VIEW_LABEL });
}

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await registerClient(page.request);
});

test.afterAll(async () => {
  await page.close();
});

test.beforeEach(async () => {
  await page.unrouteAll();
  await stubMapbox(page);
});

test('should draw the route of the calculator along the roads when a client sets both points', async () => {
  const requests = await stubRouteLines(page, ROUTING_API_PATHS.PREVIEW, () => [PARCEL_SEGMENT]);

  const map = await chooseCalculatorRoute(page);

  await expectRoadLines(map, 1);
  await expect(routeUnavailableBadge(map)).toHaveCount(0);
  expect(requests.at(-1)?.postDataJSON()).toEqual({
    pickup: { latitude: SVERDLOVA.latitude, longitude: SVERDLOVA.longitude },
    delivery: { latitude: PRITYTSKOGO.latitude, longitude: PRITYTSKOGO.longitude },
  });
});

test('should show only the points and the badge, then the line once the route comes back', async () => {
  test.setTimeout(RETRY_WAIT_MS * 3);
  let segments = withoutLines([PARCEL_SEGMENT]);
  await stubRouteLines(page, ROUTING_API_PATHS.PREVIEW, () => segments);

  const map = await chooseCalculatorRoute(page);

  await expect(routeUnavailableBadge(map)).toBeVisible();
  await expectRoadLines(map, 0);
  await expect(map.locator(`.${MAP_CLASS.MARKER}`)).toHaveCount(2);
  await expectTagsInside(map);

  segments = [PARCEL_SEGMENT];

  await expect(routeUnavailableBadge(map)).toBeHidden({ timeout: RETRY_WAIT_MS });
  await expectRoadLines(map, 1);
});

test('should draw the route of the order form along the roads', async () => {
  await stubRouteLines(page, ROUTING_API_PATHS.PREVIEW, () => [PARCEL_SEGMENT]);

  await expectRoadLines(await chooseCheckoutRoute(page), 1);
});

test('should draw the trip of the parcel and the way of the courier on the order page', async () => {
  await stubClientOrderRoute(page, ORDER_ID, () => [PARCEL_SEGMENT, COURIER_SEGMENT]);

  const map = await openOrder();

  await expectRoadLines(map, 2);
  await expect(routeUnavailableBadge(map)).toHaveCount(0);
});

test('should keep the trip of the parcel and show the badge when the way of the courier is missing', async () => {
  await stubClientOrderRoute(page, ORDER_ID, () => [
    PARCEL_SEGMENT,
    ...withoutLines([COURIER_SEGMENT]),
  ]);

  const map = await openOrder();

  await expect(routeUnavailableBadge(map)).toBeVisible();
  await expectRoadLines(map, 1);
});

test('should show only the points and the badge on the order page when routing is down', async () => {
  await stubClientOrderRoute(page, ORDER_ID, () => withoutLines([PARCEL_SEGMENT, COURIER_SEGMENT]));

  const map = await openOrder();

  await expect(routeUnavailableBadge(map)).toBeVisible();
  await expectRoadLines(map, 0);
  await expect(map.locator(`.${MAP_CLASS.MARKER}`)).toHaveCount(2);
});
