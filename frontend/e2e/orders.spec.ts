import { expect, type Page, test } from '@playwright/test';
import { formatOrderNumber } from '../src/entities/order/lib/order-number';
import { ORDER_STATUS_META } from '../src/entities/order/model/order-status';
import { AUTH_TEXTS } from '../src/pages/auth/config/texts';
import { LANDING_TEXTS } from '../src/pages/landing/config/texts';
import { PAYMENT_RETURN, PAYMENT_RETURN_PARAM } from '../src/pages/order/config/payment-return';
import { PROGRESS_STOP_LABELS } from '../src/pages/order/config/progress';
import { CANCEL_TEXTS, ORDER_DETAILS_TEXTS, PAYMENT_TEXTS } from '../src/pages/order/config/texts';
import { ORDERS_TEXTS } from '../src/pages/orders/config/texts';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { ROUTE_POINT, ROUTE_POINT_LABELS } from '../src/shared/config/route-point';
import { APP_ROUTES, getOrderPath } from '../src/shared/routes/app-routes';
import {
  checkoutAddressField,
  chooseAddress,
  expectCheckout,
  expectPackage,
  fillPackage,
  placeOrder,
  TEST_ORDER,
  TEST_PACKAGE,
} from './support/checkout';
import { registerClient } from './support/client';
import { addressName, stubMapbox, TEST_ADDRESSES } from './support/mapbox';

// The last step of the progress of a cancelled order.
const CANCELLED_STEP = PROGRESS_STOP_LABELS[ORDER_STATUS.CANCELLED];

if (CANCELLED_STEP === undefined) {
  throw new Error('The progress of the order has no step for a cancelled order');
}

function waitForPath(page: Page, pathname: string): Promise<void> {
  return page.waitForURL((url) => url.pathname === pathname);
}

// The status next to the title of the order page.
function orderStatus(page: Page, label: string) {
  return page.getByRole('heading', { level: 1 }).locator('..').getByText(label, { exact: true });
}

// The number of the order, not followed by another digit: №12 must not match №123.
function orderNumberPattern(orderId: number): RegExp {
  return new RegExp(`${formatOrderNumber(orderId)}(?!\\d)`);
}

test.beforeEach(async ({ page }) => {
  await stubMapbox(page);
});

test('should open the order form with the route and the package when a guest orders from the calculator and signs in', async ({
  page,
  request,
}) => {
  // Registered aside: the browser stays a guest.
  const client = await registerClient(request);

  await page.goto(APP_ROUTES.HOME);
  const calculator = page.getByRole('region', { name: LANDING_TEXTS.CALC_TITLE });
  await chooseAddress(
    calculator.getByRole('combobox', {
      name: ROUTE_POINT_LABELS[ROUTE_POINT.PICKUP],
      exact: true,
    }),
    calculator,
    TEST_ADDRESSES.SVERDLOVA,
  );
  await chooseAddress(
    calculator.getByRole('combobox', {
      name: ROUTE_POINT_LABELS[ROUTE_POINT.DELIVERY],
      exact: true,
    }),
    calculator,
    TEST_ADDRESSES.PRITYTSKOGO,
  );
  await fillPackage(calculator, TEST_PACKAGE);
  await calculator.getByRole('link', { name: LANDING_TEXTS.ORDER }).click();

  await waitForPath(page, APP_ROUTES.AUTH);
  await page.getByLabel(AUTH_TEXTS.LABEL_EMAIL, { exact: true }).fill(client.email);
  await page.getByLabel(AUTH_TEXTS.LABEL_PASSWORD, { exact: true }).fill(client.password);
  await page.getByRole('button', { name: AUTH_TEXTS.SUBMIT_LOGIN, exact: true }).click();

  await waitForPath(page, APP_ROUTES.ORDER_NEW);
  await expect(checkoutAddressField(page, ROUTE_POINT.PICKUP)).toHaveValue(
    addressName(TEST_ADDRESSES.SVERDLOVA),
  );
  await expect(checkoutAddressField(page, ROUTE_POINT.DELIVERY)).toHaveValue(
    addressName(TEST_ADDRESSES.PRITYTSKOGO),
  );
  await expectPackage(page, TEST_PACKAGE);
});

test('should leave the order waiting for the payment when a client places it and comes back from Stripe without paying', async ({
  page,
}) => {
  await registerClient(page.request);

  await page.goto(APP_ROUTES.ORDER_NEW);
  const orderId = await placeOrder(page, TEST_ORDER);

  await page.goto(`${getOrderPath(orderId)}?${PAYMENT_RETURN_PARAM}=${PAYMENT_RETURN.CANCELLED}`);
  await expect(orderStatus(page, ORDER_STATUS_META[ORDER_STATUS.PENDING].label)).toBeVisible();
  // The payment did not go through, so the pay button offers to try again.
  await expect(page.getByRole('button', { name: PAYMENT_TEXTS.RETRY_PAY })).toBeVisible();

  await page.goto(APP_ROUTES.ORDERS);
  await expect(page.getByRole('heading', { name: ORDERS_TEXTS.PAGE_TITLE })).toBeVisible();
  await expect(page.getByRole('link', { name: orderNumberPattern(orderId) })).toBeVisible();
});

test('should fill the order form from the cancelled order when a client cancels it and repeats it', async ({
  page,
}) => {
  await registerClient(page.request);

  await page.goto(APP_ROUTES.ORDER_NEW);
  const orderId = await placeOrder(page, TEST_ORDER);

  await page.goto(getOrderPath(orderId));
  await page.getByRole('button', { name: PAYMENT_TEXTS.CANCEL }).click();
  const dialog = page.getByRole('dialog', { name: CANCEL_TEXTS.title(formatOrderNumber(orderId)) });
  await dialog.getByRole('button', { name: CANCEL_TEXTS.CONFIRM }).click();
  await expect(dialog).toBeHidden();

  await expect(orderStatus(page, ORDER_STATUS_META[ORDER_STATUS.CANCELLED].label)).toBeVisible();
  const progress = page.getByRole('region', { name: ORDER_DETAILS_TEXTS.SECTION_PROGRESS });
  await expect(progress.getByRole('listitem').last()).toContainText(CANCELLED_STEP);

  await page.getByRole('link', { name: PAYMENT_TEXTS.REPEAT }).click();
  await waitForPath(page, APP_ROUTES.ORDER_NEW);
  await expectCheckout(page, TEST_ORDER);
});
