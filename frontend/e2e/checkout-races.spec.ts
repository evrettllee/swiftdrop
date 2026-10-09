import { setTimeout as delay } from 'node:timers/promises';
import { expect, type Page, test } from '@playwright/test';
import { PRICE_TEXTS } from '../src/entities/price/config/texts';
import { CHECKOUT_TEXTS } from '../src/pages/checkout/config/texts';
import { ORDERS_API_PATHS } from '../src/shared/api/endpoints/order';
import { PAYMENTS_API_PATHS } from '../src/shared/api/endpoints/payment';
import { API_BASE_PATH, HTTP_METHOD } from '../src/shared/api/request-config';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { fillCheckout, TEST_ORDER } from './support/checkout';
import { registerClient } from './support/client';
import { stubMapbox } from './support/mapbox';
import { STRIPE_CHECKOUT_ORIGIN, stubStripeCheckout } from './support/stripe';

// A slow network: the order is still being placed while the client keeps pressing.
const ORDER_DELAY_MS = 1000;
const HTTP_NO_CONTENT = 204;
const SECOND_ORDER_WAIT_MS = 1000;

function isOrderPost(url: URL, method: string): boolean {
  return method === HTTP_METHOD.POST && url.pathname === `${API_BASE_PATH}${ORDERS_API_PATHS.ORDERS}`;
}

// Counts the orders the page asks to place, each answered after `delayMs`.
async function countOrderPosts(page: Page, delayMs = 0): Promise<{ count: number }> {
  const counter = { count: 0 };

  await page.route(
    (url) => url.pathname === `${API_BASE_PATH}${ORDERS_API_PATHS.ORDERS}`,
    async (route) => {
      if (!isOrderPost(new URL(route.request().url()), route.request().method())) {
        await route.fallback();
        return;
      }

      counter.count += 1;
      await delay(delayMs);
      await route.continue();
    },
  );

  return counter;
}

async function openFilledCheckout(page: Page): Promise<void> {
  await stubMapbox(page);
  await registerClient(page.request);
  await page.goto(APP_ROUTES.ORDER_NEW);
  await fillCheckout(page, TEST_ORDER);

  const summary = page.getByRole('complementary', { name: CHECKOUT_TEXTS.SECTION_SUMMARY });
  await expect(summary.getByText(PRICE_TEXTS.TOTAL, { exact: true })).toBeVisible();
}

function submitButton(page: Page) {
  return page.getByRole('button', { name: CHECKOUT_TEXTS.SUBMIT });
}

test('should place one order when the client double-clicks and presses Enter while the order is being placed', async ({
  page,
}) => {
  await openFilledCheckout(page);
  await stubStripeCheckout(page);
  const orders = await countOrderPosts(page, ORDER_DELAY_MS);

  await submitButton(page).dblclick();
  await page.getByLabel(CHECKOUT_TEXTS.RECIPIENT_NAME, { exact: true }).press('Enter');
  await page.waitForURL((url) => url.origin === STRIPE_CHECKOUT_ORIGIN);

  expect(orders.count).toBe(1);
});

// The order is placed and the payment started, but the Stripe page does not replace the form yet:
// a navigation answered with 204 keeps the current page, as a slow or stalled one does. The client
// presses the button again.
test('should place one order when the client presses the button again after the payment started', async ({
  page,
}) => {
  await openFilledCheckout(page);
  const orders = await countOrderPosts(page);
  await page.route(`${STRIPE_CHECKOUT_ORIGIN}/**`, (route) =>
    route.fulfill({ status: HTTP_NO_CONTENT }),
  );
  const paymentStarted = page.waitForResponse(
    (response) =>
      response.request().method() === HTTP_METHOD.POST &&
      new URL(response.url()).pathname === `${API_BASE_PATH}${PAYMENTS_API_PATHS.PAYMENTS}`,
  );

  await submitButton(page).click();
  await paymentStarted;
  // A click from inside the page: Playwright would wait for the stalled navigation first, while a
  // person can press the button right away.
  await submitButton(page).evaluate((button: HTMLElement) => button.click());

  // A second order would be asked for right on the click; this is time enough to see it.
  await delay(SECOND_ORDER_WAIT_MS);
  expect(orders.count).toBe(1);
});
