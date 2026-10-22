import { expect, type Locator, type Page, test } from '@playwright/test';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { getOrderPath } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { MAP_TEXTS } from '../src/shared/ui/route-map/map';
import { stubMapbox } from './support/mapbox';
import { buildTestOrderDetails, stubOrderCourier } from './support/order-details';
import { PARCEL_SEGMENT, stubClientOrderRoute } from './support/routing';
import { stubSession } from './support/stub-session';

// The maps of a client have the controls of the maps of a courier: the zoom (on the desktop and in
// the full screen), the full screen of the browser, and no other way to enlarge the map.
const ORDER_ID = 990010;
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 375, height: 812 };

async function openOrderMap(
  page: Page,
  viewport: { width: number; height: number },
): Promise<Locator> {
  await page.setViewportSize(viewport);
  await stubSession(page, ROLE.CLIENT);
  await stubMapbox(page);
  await stubClientOrderRoute(page, ORDER_ID, () => [PARCEL_SEGMENT]);
  await page.route(`**${API_BASE_PATH}/orders/${ORDER_ID}`, (route) =>
    route.fulfill({ json: buildTestOrderDetails(ORDER_ID, ORDER_STATUS.COURIER_ASSIGNED) }),
  );
  await stubOrderCourier(page, ORDER_ID, () => ORDER_STATUS.COURIER_ASSIGNED);
  await page.goto(getOrderPath(ORDER_ID));

  return page.getByRole('region', { name: MAP_TEXTS.VIEW_LABEL });
}

test('should give the map of the order the zoom and the full screen on the desktop', async ({
  page,
}) => {
  const map = await openOrderMap(page, DESKTOP);

  await expect(map.getByRole('button', { name: MAP_TEXTS.ZOOM_IN })).toBeVisible();
  await expect(map.getByRole('button', { name: MAP_TEXTS.ZOOM_OUT })).toBeVisible();
  await expect(map.getByRole('button', { name: MAP_TEXTS.FULLSCREEN })).toBeVisible();
  await expect(map.getByRole('button', { name: MAP_TEXTS.LOCATE })).toHaveCount(0);
  await expect(map.getByRole('button')).toHaveCount(3);
});

test('should hide the zoom of the map of the order on a phone', async ({ page }) => {
  const map = await openOrderMap(page, PHONE);

  await expect(map.getByRole('button', { name: MAP_TEXTS.FULLSCREEN })).toBeVisible();
  await expect(map.getByRole('button', { name: MAP_TEXTS.ZOOM_IN })).toBeHidden();
});

test('should take the map of the order to the full screen and back', async ({ page }) => {
  const map = await openOrderMap(page, DESKTOP);
  const isMapFullscreen = () => map.evaluate((element) => document.fullscreenElement === element);

  await map.getByRole('button', { name: MAP_TEXTS.FULLSCREEN }).click();

  await expect.poll(isMapFullscreen).toBe(true);
  await map.getByRole('button', { name: MAP_TEXTS.EXIT_FULLSCREEN }).click();
  await expect.poll(isMapFullscreen).toBe(false);
});
