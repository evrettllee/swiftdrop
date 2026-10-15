import { expect, type Page, test } from '@playwright/test';
import { COURIER_LAYOUT_TEXTS } from '../src/app/layouts/courier-layout/navigation';
import { AUTH_TEXTS } from '../src/pages/auth/config/texts';
import { FORBIDDEN_TEXTS } from '../src/pages/forbidden/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { registerClient } from './support/client';

// Couriers are not registered through the API: the account comes from the seed of the backend,
// and its email and password are given to the tests through these variables.
const COURIER_EMAIL = process.env.E2E_COURIER_EMAIL ?? '';
const COURIER_PASSWORD = process.env.E2E_COURIER_PASSWORD ?? '';

const COURIER_NAV_LABELS = [
  COURIER_LAYOUT_TEXTS.NAV_WORK,
  COURIER_LAYOUT_TEXTS.NAV_HISTORY,
  COURIER_LAYOUT_TEXTS.NAV_PROFILE,
];

async function signInWithForm(page: Page, email: string, password: string): Promise<void> {
  await page.goto(APP_ROUTES.AUTH);
  await page.getByLabel(AUTH_TEXTS.LABEL_EMAIL, { exact: true }).fill(email);
  await page.getByLabel(AUTH_TEXTS.LABEL_PASSWORD, { exact: true }).fill(password);
  await page.getByRole('button', { name: AUTH_TEXTS.SUBMIT_LOGIN, exact: true }).click();
}

test('should open the courier cabinet with its three menu items when a courier signs in', async ({
  page,
}) => {
  test.skip(
    COURIER_EMAIL === '' || COURIER_PASSWORD === '',
    'Set E2E_COURIER_EMAIL and E2E_COURIER_PASSWORD to the seeded courier',
  );

  await signInWithForm(page, COURIER_EMAIL, COURIER_PASSWORD);

  await page.waitForURL((url) => url.pathname === APP_ROUTES.COURIER_WORK);
  const menu = page.getByRole('navigation', { name: COURIER_LAYOUT_TEXTS.NAV_LABEL });
  await expect(menu.getByRole('link')).toHaveText(COURIER_NAV_LABELS);
  await expect(menu.getByRole('link', { name: COURIER_LAYOUT_TEXTS.NAV_WORK })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('should show the 403 page when a client opens the courier cabinet', async ({ page }) => {
  // Registered with the cookies of the browser: the page is signed in as this client.
  await registerClient(page.request);

  await page.goto(APP_ROUTES.COURIER_WORK);

  await expect(
    page.getByRole('heading', { name: FORBIDDEN_TEXTS.FORBIDDEN_TITLE, level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('navigation', { name: COURIER_LAYOUT_TEXTS.NAV_LABEL })).toHaveCount(
    0,
  );
});
