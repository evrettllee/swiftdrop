import { expect, test } from '@playwright/test';
import { FORBIDDEN_TEXTS } from '../src/pages/forbidden/config/texts';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE, type Role } from '../src/shared/session/auth-user';
import { stubAppSocket } from './support/app-socket';
import { stubSession } from './support/stub-session';

const CLIENT_PAGES = [
  APP_ROUTES.ORDERS,
  '/orders/48231',
  APP_ROUTES.ORDER_NEW,
  APP_ROUTES.ADDRESSES,
  APP_ROUTES.SUPPORT,
  '/support/91',
  APP_ROUTES.PROFILE,
];

const COURIER_PAGES = [
  APP_ROUTES.COURIER_WORK,
  APP_ROUTES.COURIER_HISTORY,
  '/courier/history/48231',
  APP_ROUTES.COURIER_VEHICLE,
  APP_ROUTES.COURIER_SUPPORT,
  '/courier/support/91',
  APP_ROUTES.COURIER_PROFILE,
];

const MANAGER_PAGES = [
  APP_ROUTES.MANAGER_ORDERS,
  '/manager/orders/48231',
  APP_ROUTES.MANAGER_MAP,
  APP_ROUTES.MANAGER_SUPPORT,
  APP_ROUTES.MANAGER_ZONES,
  APP_ROUTES.MANAGER_ZONE_NEW,
  '/manager/zones/3/contour',
  APP_ROUTES.MANAGER_ANALYTICS,
  APP_ROUTES.MANAGER_ANALYTICS_COURIERS,
  APP_ROUTES.MANAGER_PROFILE,
];

const FOREIGN_PAGES: Record<
  typeof ROLE.CLIENT | typeof ROLE.COURIER | typeof ROLE.MANAGER,
  string[]
> = {
  [ROLE.CLIENT]: [...COURIER_PAGES, ...MANAGER_PAGES],
  [ROLE.COURIER]: [...CLIENT_PAGES, ...MANAGER_PAGES],
  [ROLE.MANAGER]: [...CLIENT_PAGES, ...COURIER_PAGES],
};

for (const role of [ROLE.CLIENT, ROLE.COURIER, ROLE.MANAGER] satisfies Role[]) {
  for (const path of FOREIGN_PAGES[role]) {
    test(`should close ${path} to a ${role} by the 403 page`, async ({ page }) => {
      await stubSession(page, role);
      await stubAppSocket(page);

      await page.goto(path);

      await expect(
        page.getByRole('heading', { name: FORBIDDEN_TEXTS.FORBIDDEN_TITLE }),
      ).toBeVisible();
    });
  }
}
