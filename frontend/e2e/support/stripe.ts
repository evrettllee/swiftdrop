import type { Page } from '@playwright/test';

export const STRIPE_CHECKOUT_ORIGIN = 'https://checkout.stripe.com';
// The id of a Checkout Session in its URL, for example cs_test_a1B2c3.
export const CHECKOUT_SESSION_ID_PATTERN = /\/cs_(?:test|live)_\w+/;

const STUB_PAGE = '<!doctype html><html lang="en"><title>Stripe Checkout</title></html>';

// The payment page of Stripe is replaced by an empty page: the tests check only that the app went
// there with the session the backend created.
export async function stubStripeCheckout(page: Page): Promise<void> {
  await page.route(`${STRIPE_CHECKOUT_ORIGIN}/**`, (route) =>
    route.fulfill({ contentType: 'text/html', body: STUB_PAGE }),
  );
}
