import { expect, type Page, test } from '@playwright/test';
import {
  COURIER_STATUS,
  COURIER_STATUS_META,
} from '../src/app/layouts/courier-layout/courier-status';
import { NAVIGATOR_MODES } from '../src/pages/courier-work/config/order-steps';
import { ORDER_STEP_TEXTS, ORDER_TEXTS } from '../src/pages/courier-work/config/texts';
import { VEHICLE_TYPE } from '../src/shared/api/endpoints/courier';
import { COURIER_ORDERS_API_PATHS } from '../src/shared/api/endpoints/courier-order';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { HTTP_STATUS } from '../src/shared/api/request-config';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { UI_TEXTS } from '../src/shared/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { requireCourier, signInAsCourier } from './support/courier';
import {
  buildOrderStubState,
  buildTestOrder,
  type OrderStubState,
  stubCourierOnOrder,
  stubOrderStep,
} from './support/courier-order';
import { waitForPath } from './support/courier-pages';
import { stubMapbox } from './support/mapbox';
import { COURIER_SEGMENT, PARCEL_SEGMENT, stubRouteLines } from './support/routing';

// The order, the profile and the steps come from the stubbed API: no order is placed and the
// seeded courier is not changed. One page signed in once serves all the tests.
test.describe.configure({ mode: 'serial' });

const ORDER_ID = 990101;
const WRONG_STEP_MESSAGE = 'Заказ уже на другом этапе или отменён';
const HTTP_OK = 200;
const PHONE_VIEWPORT = { width: 375, height: 812 };

let page: Page;
let state: OrderStubState;

function title(text: string) {
  return page.getByRole('heading', { level: 1, name: text });
}

function stepButton(text: string) {
  return page.getByRole('button', { name: text });
}

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
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.COURIER_ORDER, () => [
    COURIER_SEGMENT,
    PARCEL_SEGMENT,
  ]);
  state = buildOrderStubState(buildTestOrder(ORDER_ID, ORDER_STATUS.COURIER_ASSIGNED));
  await stubCourierOnOrder(page, state);
});

test('should take the courier through the pickup and on to the recipient', async () => {
  await stubOrderStep(page, COURIER_ORDERS_API_PATHS.pickup(ORDER_ID), () => ({
    status: HTTP_OK,
    json: buildTestOrder(ORDER_ID, ORDER_STATUS.PICKED_UP),
  }));
  await stubOrderStep(page, COURIER_ORDERS_API_PATHS.depart(ORDER_ID), () => ({
    status: HTTP_OK,
    json: buildTestOrder(ORDER_ID, ORDER_STATUS.IN_TRANSIT),
  }));
  await page.reload();

  await expect(title(ORDER_STEP_TEXTS.TO_PICKUP)).toBeVisible();
  await expect(page.getByText(ORDER_STEP_TEXTS.step(1, 3))).toBeVisible();
  await expect(page.getByText('улица Свердлова, 13а, Минск')).toBeVisible();
  await expect(page.getByText('проспект Притыцкого, 83, кв. 47, Минск')).toBeVisible();

  const pickup = page.waitForRequest(
    (request) =>
      request.method() === 'POST' &&
      request.url().endsWith(COURIER_ORDERS_API_PATHS.pickup(ORDER_ID)),
  );
  await stepButton(ORDER_STEP_TEXTS.PICK_UP).click();
  await pickup;
  await expect(title(ORDER_STEP_TEXTS.PICKED_UP)).toBeVisible();

  await stepButton(ORDER_STEP_TEXTS.DEPART).click();

  await expect(title(ORDER_STEP_TEXTS.TO_RECIPIENT)).toBeVisible();
  await expect(page.getByText(ORDER_STEP_TEXTS.CODE_HINT)).toBeVisible();
  await expect(stepButton(ORDER_STEP_TEXTS.ENTER_CODE)).toBeDisabled();
});

test('should tell the error of the backend and load the order again when the step is stale', async () => {
  await stubOrderStep(page, COURIER_ORDERS_API_PATHS.pickup(ORDER_ID), () => {
    // The order was picked up from another tab meanwhile.
    state.order = buildTestOrder(ORDER_ID, ORDER_STATUS.PICKED_UP);

    return { status: HTTP_STATUS.CONFLICT, json: { message: WRONG_STEP_MESSAGE } };
  });
  await page.reload();

  await stepButton(ORDER_STEP_TEXTS.PICK_UP).click();

  await expect(page.getByRole('alert').filter({ hasText: WRONG_STEP_MESSAGE })).toBeVisible();
  await expect(title(ORDER_STEP_TEXTS.PICKED_UP)).toBeVisible();
});

test('should go back to the line when the order is gone', async () => {
  await page.reload();
  await expect(title(ORDER_STEP_TEXTS.TO_PICKUP)).toBeVisible();

  state.order = null;
  await page.reload();

  await expect(title(UI_TEXTS.COURIER_WORK)).toBeVisible();
});

test('should open the navigator for the vehicle of the courier in a new tab', async () => {
  await page.reload();
  const route = page.getByRole('link', { name: ORDER_TEXTS.ROUTE });

  await expect(route).toHaveAttribute(
    'href',
    `https://yandex.ru/maps/?rtext=~53.8945,27.5486&rtt=${NAVIGATOR_MODES[VEHICLE_TYPE.BICYCLE]}`,
  );
  await expect(route).toHaveAttribute('target', '_blank');
  await expect(route).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.getByRole('link', { name: ORDER_TEXTS.CALL_SENDER })).toHaveAttribute(
    'href',
    'tel:+375337654321',
  );
});

test('should offer no call when the sender left no phone', async () => {
  const order = buildTestOrder(ORDER_ID, ORDER_STATUS.COURIER_ASSIGNED);
  state.order = { ...order, sender: { ...order.sender, phone: null } };
  await page.reload();

  await expect(title(ORDER_STEP_TEXTS.TO_PICKUP)).toBeVisible();
  await expect(page.getByRole('link', { name: ORDER_TEXTS.CALL_SENDER })).toHaveCount(0);
  await expect(page.getByText(ORDER_TEXTS.PHONE, { exact: true })).toHaveCount(0);
});

test('should show the courier on the order in the top bar with one main button on a phone', async () => {
  await page.setViewportSize(PHONE_VIEWPORT);
  await page.reload();

  await expect(
    page
      .getByRole('status')
      .filter({ hasText: COURIER_STATUS_META[COURIER_STATUS.ON_ORDER].label }),
  ).toBeVisible();
  await expect(stepButton(ORDER_STEP_TEXTS.PICK_UP)).toHaveCount(1);
  await expect(stepButton(ORDER_STEP_TEXTS.PICK_UP)).toBeVisible();
});
