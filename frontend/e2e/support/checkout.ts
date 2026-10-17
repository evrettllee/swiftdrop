import { expect, type Locator, type Page } from '@playwright/test';
import { z } from 'zod';
import { PRICE_TEXTS } from '../../src/entities/price/config/texts';
import { PACKAGE_DIMENSIONS, PACKAGE_FIELD } from '../../src/features/package-form/config/package';
import { PACKAGE_TEXTS } from '../../src/features/package-form/config/texts';
import { CHECKOUT_TEXTS } from '../../src/pages/checkout/config/texts';
import { ORDERS_API_PATHS } from '../../src/shared/api/endpoints/order';
import { PAYMENTS_API_PATHS, startedPaymentSchema } from '../../src/shared/api/endpoints/payment';
import { API_BASE_PATH, HTTP_METHOD } from '../../src/shared/api/request-config';
import { ROUTE_POINT, ROUTE_POINT_LABELS } from '../../src/shared/config/route-point';
import { addressName, TEST_ADDRESSES, type TestAddress } from './mapbox';
import { CHECKOUT_SESSION_ID_PATTERN, STRIPE_CHECKOUT_ORIGIN, stubStripeCheckout } from './stripe';

type PackageSizeName = (typeof PACKAGE_DIMENSIONS)[number]['name'];

// The values as the package form keeps them, under the names of its fields.
export type TestPackage = Record<PackageSizeName | typeof PACKAGE_FIELD.WEIGHT, string> & {
  isFragile: boolean;
};

export type TestOrder = {
  pickup: { address: TestAddress; apartment: string };
  delivery: { address: TestAddress; apartment: string };
  // The phone as the backend keeps it, so a repeated order shows the same text.
  recipient: { name: string; phone: string };
  package: TestPackage;
};

export const TEST_PACKAGE: TestPackage = {
  [PACKAGE_FIELD.WEIGHT]: '2,5',
  [PACKAGE_FIELD.LENGTH]: '40',
  [PACKAGE_FIELD.WIDTH]: '30',
  [PACKAGE_FIELD.HEIGHT]: '20',
  isFragile: true,
};

export const TEST_ORDER: TestOrder = {
  pickup: { address: TEST_ADDRESSES.SVERDLOVA, apartment: '12' },
  delivery: { address: TEST_ADDRESSES.PRITYTSKOGO, apartment: '4' },
  recipient: { name: 'Ольга Петрова', phone: '+375291234567' },
  package: TEST_PACKAGE,
};

// Response of POST /api/orders: only the id is needed.
const placedOrderSchema = z.object({ orderId: z.number() });

type Scope = Page | Locator;

// Types into an address field and chooses the suggestion of the address.
export async function chooseAddress(field: Locator, scope: Scope, address: TestAddress) {
  const name = addressName(address);

  await field.fill(name);
  await scope.getByRole('option', { name }).click();
  await expect(field).toHaveValue(name);
}

export async function fillPackage(scope: Scope, value: TestPackage): Promise<void> {
  await scope.getByLabel(PACKAGE_TEXTS.WEIGHT, { exact: true }).fill(value[PACKAGE_FIELD.WEIGHT]);

  for (const { name, label } of PACKAGE_DIMENSIONS) {
    await scope.getByLabel(label, { exact: true }).fill(value[name]);
  }

  // The native checkbox is visually hidden under its styled label, which takes the click; the
  // state is still checked after the click.
  await scope
    .getByRole('checkbox', { name: PACKAGE_TEXTS.FRAGILE })
    .setChecked(value.isFragile, { force: true });
}

export async function expectPackage(scope: Scope, value: TestPackage): Promise<void> {
  await expect(scope.getByLabel(PACKAGE_TEXTS.WEIGHT, { exact: true })).toHaveValue(
    value[PACKAGE_FIELD.WEIGHT],
  );

  for (const { name, label } of PACKAGE_DIMENSIONS) {
    await expect(scope.getByLabel(label, { exact: true })).toHaveValue(value[name]);
  }

  await expect(scope.getByRole('checkbox', { name: PACKAGE_TEXTS.FRAGILE })).toBeChecked({
    checked: value.isFragile,
  });
}

// The block of one point on the order form: its address and apartment fields.
function pointBlock(page: Page, kind: keyof typeof ROUTE_POINT_LABELS) {
  const block = page.getByRole('group', { name: ROUTE_POINT_LABELS[kind], exact: true });

  return {
    block,
    address: block.getByRole('combobox', { name: CHECKOUT_TEXTS.ADDRESS, exact: true }),
    apartment: block.getByLabel(CHECKOUT_TEXTS.APARTMENT, { exact: true }),
  };
}

function recipientFields(page: Page) {
  return {
    name: page.getByLabel(CHECKOUT_TEXTS.RECIPIENT_NAME, { exact: true }),
    phone: page.getByLabel(CHECKOUT_TEXTS.RECIPIENT_PHONE, { exact: true }),
  };
}

export function checkoutAddressField(page: Page, kind: keyof typeof ROUTE_POINT_LABELS): Locator {
  return pointBlock(page, kind).address;
}

export async function fillCheckout(page: Page, order: TestOrder): Promise<void> {
  const pickup = pointBlock(page, ROUTE_POINT.PICKUP);
  const delivery = pointBlock(page, ROUTE_POINT.DELIVERY);
  const recipient = recipientFields(page);

  await chooseAddress(pickup.address, pickup.block, order.pickup.address);
  await pickup.apartment.fill(order.pickup.apartment);
  await chooseAddress(delivery.address, delivery.block, order.delivery.address);
  await delivery.apartment.fill(order.delivery.apartment);
  await recipient.name.fill(order.recipient.name);
  await recipient.phone.fill(order.recipient.phone);
  await fillPackage(page, order.package);
}

export async function expectCheckout(page: Page, order: TestOrder): Promise<void> {
  const pickup = pointBlock(page, ROUTE_POINT.PICKUP);
  const delivery = pointBlock(page, ROUTE_POINT.DELIVERY);
  const recipient = recipientFields(page);

  await expect(pickup.address).toHaveValue(addressName(order.pickup.address));
  await expect(pickup.apartment).toHaveValue(order.pickup.apartment);
  await expect(delivery.address).toHaveValue(addressName(order.delivery.address));
  await expect(delivery.apartment).toHaveValue(order.delivery.apartment);
  await expect(recipient.name).toHaveValue(order.recipient.name);
  await expect(recipient.phone).toHaveValue(order.recipient.phone);
  await expectPackage(page, order.package);
}

// The body of the next POST to an API path. The browser leaves for Stripe right after the payment
// answer, so the body is read on the way, before the page gets it. It comes wrapped: an awaited
// async function would otherwise wait for the body itself, before the request is even sent.
async function capturePostBody(page: Page, path: string): Promise<{ body: Promise<unknown> }> {
  const { promise, resolve } = Promise.withResolvers<unknown>();

  await page.route(
    (url) => url.pathname === `${API_BASE_PATH}${path}`,
    async (route) => {
      if (route.request().method() !== HTTP_METHOD.POST) {
        await route.fallback();
        return;
      }

      const response = await route.fetch();
      resolve(await response.json());
      await route.fulfill({ response });
    },
  );

  return { body: promise };
}

export type PlacedOrder = { orderId: number; sessionId: string };

// Fills the order form, waits for the price and goes to the payment: the order is placed, and the
// browser lands on the (replaced) Stripe page of the session the backend created, whose id is
// the last part of its address.
export async function placeOrderWithSession(page: Page, order: TestOrder): Promise<PlacedOrder> {
  await stubStripeCheckout(page);
  await fillCheckout(page, order);

  const summary = page.getByRole('complementary', { name: CHECKOUT_TEXTS.SECTION_SUMMARY });
  await expect(summary.getByText(PRICE_TEXTS.TOTAL, { exact: true })).toBeVisible();

  const orderCapture = await capturePostBody(page, ORDERS_API_PATHS.ORDERS);
  const paymentCapture = await capturePostBody(page, PAYMENTS_API_PATHS.PAYMENTS);

  await page.getByRole('button', { name: CHECKOUT_TEXTS.SUBMIT }).click();

  const { orderId } = placedOrderSchema.parse(await orderCapture.body);
  const { checkoutUrl } = startedPaymentSchema.parse(await paymentCapture.body);

  await page.waitForURL((url) => url.origin === STRIPE_CHECKOUT_ORIGIN);
  expect(page.url()).toBe(checkoutUrl);
  expect(new URL(checkoutUrl).pathname).toMatch(CHECKOUT_SESSION_ID_PATTERN);

  const sessionId = new URL(checkoutUrl).pathname.match(CHECKOUT_SESSION_ID_PATTERN)?.[0].slice(1);

  return { orderId, sessionId: sessionId ?? '' };
}

export async function placeOrder(page: Page, order: TestOrder): Promise<number> {
  return (await placeOrderWithSession(page, order)).orderId;
}
