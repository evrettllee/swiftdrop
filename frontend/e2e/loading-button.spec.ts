import { expect, type Locator, type Page, test } from '@playwright/test';
import { AUTH_API_PATHS } from '../src/shared/api/endpoints/auth';
import { ORDERS_API_PATHS } from '../src/shared/api/endpoints/order';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { API_BASE_PATH, HTTP_METHOD } from '../src/shared/api/request-config';
import { PRICING_API_PATHS } from '../src/features/estimate-price/config/estimate';
import { CHECKOUT_TEXTS } from '../src/pages/checkout/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { fillCheckout, TEST_ORDER } from './support/checkout';
import { stubMapbox } from './support/mapbox';

// The pay button of the order form while the order is being placed. The session, the price and
// the order all come from the stubbed API, so no client is registered.
const ESTIMATE = {
  price: 9.23,
  currency: 'BYN',
  distanceKm: 7.98,
  estimatedMinutes: 22,
  coefficient: 1,
};
const TEST_CLIENT = {
  userId: 990005,
  firstName: 'Анна',
  lastName: 'Тестова',
  email: 'loading-button@example.com',
  phone: null,
  role: ROLE.CLIENT,
};
const CENTER_TOLERANCE_PX = 1;
const SPINNER_SELECTOR = '.animate-spin';

type Center = { x: number; y: number };

// The spinner turns, and the box of a turned element grows with the angle; its center does not.
async function centerOf(element: Locator): Promise<Center> {
  const box = await element.boundingBox();

  if (box === null) {
    throw new Error('The element is not on the page');
  }

  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function stubCheckout(page: Page): Promise<void> {
  await stubMapbox(page);
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.ME}`, (route) =>
    route.fulfill({ json: TEST_CLIENT }),
  );
  await page.route(`**${API_BASE_PATH}${PRICING_API_PATHS.ESTIMATES}`, (route) =>
    route.fulfill({ json: ESTIMATE }),
  );
  await page.route(`**${API_BASE_PATH}${ROUTING_API_PATHS.PREVIEW}`, (route) =>
    route.fulfill({ json: { segments: [] } }),
  );
  // The order is never answered: the button stays in its loading state.
  await page.route(`**${API_BASE_PATH}${ORDERS_API_PATHS.ORDERS}`, (route) =>
    route.request().method() === HTTP_METHOD.POST ? new Promise(() => undefined) : route.fallback(),
  );
}

test('should keep the size of the pay button and center its spinner while the order is placed', async ({
  page,
}) => {
  await stubCheckout(page);
  await page.goto(APP_ROUTES.ORDER_NEW);
  await fillCheckout(page, TEST_ORDER);
  const button = page.getByRole('button', { name: CHECKOUT_TEXTS.SUBMIT });
  await expect(button).toBeEnabled();
  const before = await button.boundingBox();
  const background = await button.evaluate((element) => getComputedStyle(element).backgroundColor);

  await button.click();

  // The name stays for a screen reader: the text is only unseen.
  await expect(button).toHaveAttribute('aria-busy', 'true');
  await expect(button).toBeDisabled();
  const after = await button.boundingBox();
  expect(after?.width).toBe(before?.width);
  expect(after?.height).toBe(before?.height);

  const buttonCenter = await centerOf(button);
  const spinnerCenter = await centerOf(button.locator(SPINNER_SELECTOR));
  expect(Math.abs(spinnerCenter.x - buttonCenter.x)).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
  expect(Math.abs(spinnerCenter.y - buttonCenter.y)).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);

  // A busy button keeps the look of its variant, not the look of a disabled one.
  expect(await button.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
    background,
  );
});
