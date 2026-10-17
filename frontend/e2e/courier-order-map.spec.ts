import { expect, type Page, test } from '@playwright/test';
import { NAVIGATOR_MODES } from '../src/pages/courier-work/config/order-steps';
import { ORDER_STEP_TEXTS, ORDER_TEXTS } from '../src/pages/courier-work/config/texts';
import { VEHICLE_TYPE } from '../src/shared/api/endpoints/courier';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { MAP_TEXTS } from '../src/shared/ui/route-map/map';
import { requireCourier, signInAsCourier } from './support/courier';
import { buildOrderStubState, buildTestOrder, stubCourierOnOrder } from './support/courier-order';
import { waitForPath } from './support/courier-pages';
import { stubMapbox } from './support/mapbox';
import { COURIER_SEGMENT, PARCEL_SEGMENT, stubRouteLines } from './support/routing';

// As in courier-order.spec: the order comes from the stubbed API. The courier is on the line in the
// stub, so the page follows the device and knows where the courier is.
test.describe.configure({ mode: 'serial' });

const ORDER_ID = 990102;
// More digits than the navigator takes: the link rounds them to six.
const DEVICE_POSITION = { latitude: 53.9123456789, longitude: 27.5678901234 };
const DEVICE_IN_LINK = '53.912346,27.56789';
const PICKUP_IN_LINK = '53.8945,27.5486';
const PHONE_VIEWPORT = { width: 375, height: 812 };
const DESKTOP_VIEWPORT = { width: 1440, height: 1000 };

let page: Page;

function orderMap() {
  return page.getByRole('region', { name: MAP_TEXTS.COURIER_ROUTE_LABEL });
}

function navigatorHref(start: string): string {
  return `https://yandex.ru/maps/?rtext=${start}~${PICKUP_IN_LINK}&rtt=${NAVIGATOR_MODES[VEHICLE_TYPE.BICYCLE]}`;
}

test.beforeAll(async ({ browser }) => {
  requireCourier();
  page = await browser.newPage({ viewport: DESKTOP_VIEWPORT });
  await signInAsCourier(page);
  await waitForPath(page, APP_ROUTES.COURIER_WORK);
});

// The page is not opened when the courier is not given and the tests are skipped.
test.afterAll(async () => {
  await page?.close();
});

async function openOrder(isAvailable: boolean): Promise<void> {
  await page.unrouteAll();
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.COURIER_ORDER, () => [
    COURIER_SEGMENT,
    PARCEL_SEGMENT,
  ]);
  await stubCourierOnOrder(
    page,
    buildOrderStubState(buildTestOrder(ORDER_ID, ORDER_STATUS.COURIER_ASSIGNED), isAvailable),
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { level: 1, name: ORDER_STEP_TEXTS.TO_PICKUP }),
  ).toBeVisible();
}

test('should start the navigator from the place of the device when the cabinet does not know the courier', async () => {
  await openOrder(false);

  await expect(page.getByRole('link', { name: ORDER_TEXTS.ROUTE })).toHaveAttribute(
    'href',
    navigatorHref(''),
  );
  await expect(orderMap().getByRole('button', { name: MAP_TEXTS.LOCATE })).toHaveCount(0);
});

test('should start the navigator from the courier and give the map the controls of the work page', async () => {
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation(DEVICE_POSITION);
  await openOrder(true);
  const map = orderMap();

  await expect(page.getByRole('link', { name: ORDER_TEXTS.ROUTE })).toHaveAttribute(
    'href',
    navigatorHref(DEVICE_IN_LINK),
  );
  await expect(map.getByRole('button', { name: MAP_TEXTS.LOCATE })).toBeVisible();
  await expect(map.getByRole('button', { name: MAP_TEXTS.FULLSCREEN })).toBeVisible();
  await expect(map.getByRole('button', { name: MAP_TEXTS.ZOOM_IN })).toBeVisible();
});

test('should hide the zoom buttons of the order map on a phone', async () => {
  await page.setViewportSize(PHONE_VIEWPORT);
  await openOrder(true);
  const map = orderMap();

  await expect(map.getByRole('button', { name: MAP_TEXTS.LOCATE })).toBeVisible();
  await expect(map.getByRole('button', { name: MAP_TEXTS.ZOOM_IN })).toBeHidden();
  await expect(map.getByRole('button', { name: MAP_TEXTS.ZOOM_OUT })).toBeHidden();
});
