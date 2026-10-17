import { expect, type Page, test } from '@playwright/test';
import {
  DELIVERY_CODE_TEXTS,
  ORDER_DELIVERED_TEXTS,
  ORDER_STEP_TEXTS,
} from '../src/pages/courier-work/config/texts';
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
import { PARCEL_SEGMENT, stubRouteLines } from './support/routing';

// The order, the profile and the answers to the code come from the stubbed API: no order is
// delivered and the seeded courier is not changed. One page signed in once serves all the tests.
test.describe.configure({ mode: 'serial' });

const ORDER_ID = 990102;
const DELIVER_PATH = COURIER_ORDERS_API_PATHS.deliver(ORDER_ID);
const WRONG_CODE_MESSAGE = 'Неверный код. Осталось попыток: 4';
const LOCKED_MESSAGE = 'Слишком много неверных попыток. Попробуйте через 15 мин.';
const BUSY_MESSAGE = 'Заказ уже на другом этапе или отменён';
const HTTP_OK = 200;
const CODE = '4821';

let page: Page;
let state: OrderStubState;

function title(text: string) {
  return page.getByRole('heading', { level: 1, name: text });
}

function button(text: string) {
  return page.getByRole('button', { name: text });
}

function codeField() {
  return page.getByLabel(DELIVERY_CODE_TEXTS.LABEL, { exact: true });
}

// The code screen of the order on its way to the recipient.
async function openCodeScreen(): Promise<void> {
  await page.reload();
  await button(ORDER_STEP_TEXTS.ENTER_CODE).click();
  await expect(title(DELIVERY_CODE_TEXTS.TITLE)).toBeVisible();
}

// The browser puts the text of the clipboard into the focused field.
async function pasteIntoCodeField(text: string): Promise<void> {
  await codeField().evaluate((field, pasted) => {
    const data = new DataTransfer();
    data.setData('text/plain', pasted);
    field.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }));
  }, text);
}

async function stubDeliver(status: number, json: object): Promise<void> {
  await stubOrderStep(page, DELIVER_PATH, () => ({ status, json }));
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
  await stubRouteLines(page, ROUTING_API_PATHS.COURIER_ORDER, () => [PARCEL_SEGMENT]);
  state = buildOrderStubState(buildTestOrder(ORDER_ID, ORDER_STATUS.IN_TRANSIT));
  await stubCourierOnOrder(page, state);
});

test('should open the code screen with the field focused and wait for all the digits', async () => {
  await openCodeScreen();

  await expect(codeField()).toBeFocused();
  await expect(button(DELIVERY_CODE_TEXTS.SUBMIT)).toBeDisabled();

  await codeField().pressSequentially(CODE.slice(0, 3));
  await expect(button(DELIVERY_CODE_TEXTS.SUBMIT)).toBeDisabled();

  await codeField().pressSequentially(CODE.slice(3));
  await expect(button(DELIVERY_CODE_TEXTS.SUBMIT)).toBeEnabled();
});

test('should keep only the digits that are typed or pasted', async () => {
  await openCodeScreen();

  await codeField().pressSequentially('1a-2 b');
  await expect(codeField()).toHaveValue('12');

  await codeField().fill('');
  await pasteIntoCodeField('12a34');
  await expect(codeField()).toHaveValue('1234');
});

test('should tell a wrong code under the field and clear it', async () => {
  await stubDeliver(HTTP_STATUS.UNPROCESSABLE_CONTENT, { message: WRONG_CODE_MESSAGE });
  await openCodeScreen();

  await codeField().fill(CODE);
  await button(DELIVERY_CODE_TEXTS.SUBMIT).click();

  await expect(page.getByRole('alert').filter({ hasText: WRONG_CODE_MESSAGE })).toBeVisible();
  await expect(codeField()).toHaveValue('');
  await expect(codeField()).toHaveAttribute('aria-invalid', 'true');
  await expect(codeField()).toBeFocused();

  await codeField().pressSequentially('1');
  await expect(codeField()).toHaveAttribute('aria-invalid', 'false');
});

test('should tell that the tries are over for now', async () => {
  await stubDeliver(HTTP_STATUS.TOO_MANY_REQUESTS, { message: LOCKED_MESSAGE });
  await openCodeScreen();

  await codeField().fill(CODE);
  await button(DELIVERY_CODE_TEXTS.SUBMIT).click();

  await expect(page.getByRole('alert').filter({ hasText: LOCKED_MESSAGE })).toBeVisible();
  await expect(codeField()).toHaveValue('');
});

test('should close the order with the right code and go back to work', async () => {
  await stubOrderStep(page, DELIVER_PATH, () => {
    // The backend frees the courier of the delivered order.
    state.profile = { ...state.profile, activeOrderId: null };

    return { status: HTTP_OK, json: buildTestOrder(ORDER_ID, ORDER_STATUS.DELIVERED) };
  });
  await openCodeScreen();

  await codeField().fill(CODE);
  const deliver = page.waitForRequest(
    (request) => request.method() === 'POST' && request.url().endsWith(DELIVER_PATH),
  );
  await button(DELIVERY_CODE_TEXTS.SUBMIT).click();

  expect((await deliver).postDataJSON()).toEqual({ code: CODE });
  await expect(title(ORDER_DELIVERED_TEXTS.TITLE)).toBeVisible();
  await expect(page.getByText(new RegExp(`№${ORDER_ID} закрыт в \\d{2}:\\d{2}\\.`))).toBeVisible();

  await button(ORDER_DELIVERED_TEXTS.BACK_TO_WORK).click();
  await expect(title(UI_TEXTS.COURIER_WORK)).toBeVisible();
});

test('should go back to the order with the error when the order has moved on', async () => {
  await stubDeliver(HTTP_STATUS.CONFLICT, { message: BUSY_MESSAGE });
  await openCodeScreen();

  await codeField().fill(CODE);
  await button(DELIVERY_CODE_TEXTS.SUBMIT).click();

  await expect(title(ORDER_STEP_TEXTS.TO_RECIPIENT)).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: BUSY_MESSAGE })).toBeVisible();
});

test('should go back to the order and forget the code', async () => {
  await openCodeScreen();
  await codeField().fill('48');

  await button(DELIVERY_CODE_TEXTS.BACK).click();
  await expect(title(ORDER_STEP_TEXTS.TO_RECIPIENT)).toBeVisible();

  await button(ORDER_STEP_TEXTS.ENTER_CODE).click();
  await expect(codeField()).toHaveValue('');
});
