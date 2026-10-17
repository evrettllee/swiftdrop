import { expect, type Page, test } from '@playwright/test';
import {
  DELIVERY_CODE_TEXTS,
  ORDER_DELIVERED_TEXTS,
  ORDER_STEP_TEXTS,
} from '../src/pages/courier-work/config/texts';
import { COURIER_ORDERS_API_PATHS } from '../src/shared/api/endpoints/courier-order';
import { ORDER_STATUS, type OrderStatus } from '../src/shared/api/endpoints/order';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { COURIER_SOCKET_EVENTS } from '../src/shared/realtime/courier-events';
import { UI_TEXTS } from '../src/shared/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import {
  buildOrderStubState,
  buildTestOrder,
  type OrderStubState,
  stubCourierOnOrder,
  stubOrderStep,
} from './support/courier-order';
import { stubMapbox } from './support/mapbox';
import { PARCEL_SEGMENT, stubRouteLines } from './support/routing';
import { stubCourierSocket, stubSession } from './support/stub-session';

// The screen of the closed order stays until the courier presses «К работе», whatever the profile
// of the cabinet is refreshed by meanwhile. The session, the order and the socket are stubbed.
const ORDER_ID = 990103;
const CODE = '4821';
const HTTP_OK = 200;

test('should keep the delivered screen when the profile is refreshed without an order', async ({
  page,
}) => {
  const state = buildOrderStubState(buildTestOrder(ORDER_ID, ORDER_STATUS.IN_TRANSIT));
  await stubSession(page, ROLE.COURIER);
  const socket = await stubCourierSocket(page);
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.COURIER_ORDER, () => [PARCEL_SEGMENT]);
  await stubCourierOnOrder(page, state);
  await page.route('**/api/couriers/me/stats/today', (route) =>
    route.fulfill({
      json: { delivered: 1, distanceKm: 8, offersReceived: 1, offersAccepted: 1, rating: null },
    }),
  );
  await stubOrderStep(page, COURIER_ORDERS_API_PATHS.deliver(ORDER_ID), () => {
    // The backend frees the courier of the delivered order.
    state.profile = { ...state.profile, activeOrderId: null };

    return { status: HTTP_OK, json: buildTestOrder(ORDER_ID, ORDER_STATUS.DELIVERED) };
  });
  await page.goto(APP_ROUTES.COURIER_WORK);
  await page.getByRole('button', { name: ORDER_STEP_TEXTS.ENTER_CODE }).click();
  await page.getByLabel(DELIVERY_CODE_TEXTS.LABEL, { exact: true }).fill(CODE);
  await page.getByRole('button', { name: DELIVERY_CODE_TEXTS.SUBMIT }).click();
  const delivered = page.getByRole('heading', { name: ORDER_DELIVERED_TEXTS.TITLE });
  await expect(delivered).toBeVisible();
  // The button of the code screen is gone: the focus goes to the title of the new screen.
  await expect(delivered).toBeFocused();

  // Another event refreshes the profile, which has no order now.
  const profileLoads = page.waitForResponse((response) => response.url().endsWith('/couriers/me'));
  socket.push(COURIER_SOCKET_EVENTS.ORDER_CANCELLED, {});
  await profileLoads;

  await expect(delivered).toBeVisible();
  await page.getByRole('button', { name: ORDER_DELIVERED_TEXTS.BACK_TO_WORK }).click();
  await expect(page.getByRole('heading', { level: 1, name: UI_TEXTS.COURIER_WORK })).toBeVisible();
});

// The stage of the order is the title of the screen: a change of it is announced once, by the
// status region around it, and the focus never stays on nothing.
async function openOrderAt(page: Page, status: OrderStatus): Promise<OrderStubState> {
  const state = buildOrderStubState(buildTestOrder(ORDER_ID, status));
  await stubSession(page, ROLE.COURIER);
  await stubCourierSocket(page);
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.COURIER_ORDER, () => [PARCEL_SEGMENT]);
  await stubCourierOnOrder(page, state);
  await page.goto(APP_ROUTES.COURIER_WORK);

  return state;
}

test('should announce the next stage of the order in a status region', async ({ page }) => {
  const state = await openOrderAt(page, ORDER_STATUS.COURIER_ASSIGNED);
  await stubOrderStep(page, COURIER_ORDERS_API_PATHS.pickup(ORDER_ID), () => {
    state.order = buildTestOrder(ORDER_ID, ORDER_STATUS.PICKED_UP);

    return { status: HTTP_OK, json: state.order };
  });
  const region = page.getByRole('status').filter({ hasText: ORDER_STEP_TEXTS.TO_PICKUP });
  await expect(region.getByRole('heading', { level: 1 })).toBeVisible();

  await page.getByRole('button', { name: ORDER_STEP_TEXTS.PICK_UP }).click();

  await expect(
    page.getByRole('status').filter({ hasText: ORDER_STEP_TEXTS.PICKED_UP }),
  ).toBeVisible();
  // The focus is on the button of the next step or on the title, never on the page itself.
  await expect(page.locator('body')).not.toBeFocused();
});

test('should put the focus on the title when the courier comes back from the code screen', async ({
  page,
}) => {
  await openOrderAt(page, ORDER_STATUS.IN_TRANSIT);
  await page.getByRole('button', { name: ORDER_STEP_TEXTS.ENTER_CODE }).click();

  await page.getByRole('button', { name: DELIVERY_CODE_TEXTS.BACK }).click();

  await expect(
    page.getByRole('heading', { level: 1, name: ORDER_STEP_TEXTS.TO_RECIPIENT }),
  ).toBeFocused();
});
