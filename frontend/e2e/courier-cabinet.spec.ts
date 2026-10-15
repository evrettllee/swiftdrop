import { expect, test } from '@playwright/test';
import { COURIER_LAYOUT_TEXTS } from '../src/app/layouts/courier-layout/navigation';
import { FORBIDDEN_TEXTS } from '../src/pages/forbidden/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { registerClient } from './support/client';
import { requireCourier, signInAsCourier } from './support/courier';

const COURIER_NAV_LABELS = [
  COURIER_LAYOUT_TEXTS.NAV_WORK,
  COURIER_LAYOUT_TEXTS.NAV_HISTORY,
  COURIER_LAYOUT_TEXTS.NAV_PROFILE,
];

test('should open the courier cabinet with its three menu items when a courier signs in', async ({
  page,
}) => {
  requireCourier();

  await signInAsCourier(page);

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
