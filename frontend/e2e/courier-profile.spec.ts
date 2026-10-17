import { expect, type Page, test } from '@playwright/test';
import { COURIER_LAYOUT_TEXTS } from '../src/app/layouts/courier-layout/navigation';
import { PROFILE_TEXTS } from '../src/pages/profile/config/texts';
import { AUTH_API_PATHS } from '../src/shared/api/endpoints/auth';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE, type Role } from '../src/shared/session/auth-user';
import { buildOrderStubState, buildTestOrder, stubCourierOnOrder } from './support/courier-order';

// The courier opens the same profile page as the client, inside the frame of the cabinet. The
// session and the cabinet answers come from the stubbed API, so no seeded courier is needed.
const EMAIL = 'profile-check@example.com';
// The frames of the socket.io handshake over a WebSocket: the server opens the transport, then
// accepts the namespace the client asks for.
const ENGINE_OPEN = '0{"sid":"e2e","upgrades":[],"pingInterval":25000,"pingTimeout":20000}';
const NAMESPACE_CONNECT_PREFIX = '40/couriers';
const NAMESPACE_CONNECTED = '40/couriers,{"sid":"e2e-couriers"}';

// The cabinet opens a socket with the cookies of a real session, which this test does not have:
// the handshake is answered here, so the socket does not ask the session to be refreshed.
async function stubCourierSocket(page: Page): Promise<void> {
  await page.routeWebSocket(`**${API_BASE_PATH}/socket.io/**`, (route) => {
    route.send(ENGINE_OPEN);
    route.onMessage((message) => {
      if (typeof message === 'string' && message.startsWith(NAMESPACE_CONNECT_PREFIX)) {
        route.send(NAMESPACE_CONNECTED);
      }
    });
  });
}

async function stubSession(page: Page, role: Role): Promise<void> {
  await page.route(`**${API_BASE_PATH}${AUTH_API_PATHS.ME}`, (route) =>
    route.fulfill({
      json: {
        userId: 990007,
        firstName: 'Анна',
        lastName: 'Тестова',
        email: EMAIL,
        phone: null,
        role,
      },
    }),
  );
}

async function expectProfileContent(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(PROFILE_TEXTS.PROFILE);
  await expect(page.getByText(`${PROFILE_TEXTS.PROFILE_EMAIL}: ${EMAIL}`)).toBeVisible();
  await expect(page.getByText(PROFILE_TEXTS.PROFILE_THEME)).toBeVisible();
  await expect(page.getByRole('button', { name: PROFILE_TEXTS.SIGN_OUT })).toBeVisible();
}

test('should show the profile of the client with its content', async ({ page }) => {
  await stubSession(page, ROLE.CLIENT);

  await page.goto(APP_ROUTES.PROFILE);

  await expectProfileContent(page);
});

test('should show the same profile to the courier inside the cabinet with its menu item active', async ({
  page,
}) => {
  await stubSession(page, ROLE.COURIER);
  await stubCourierSocket(page);
  await stubCourierOnOrder(
    page,
    buildOrderStubState(buildTestOrder(990007, ORDER_STATUS.COURIER_ASSIGNED)),
  );

  await page.goto(APP_ROUTES.COURIER_PROFILE);

  await expectProfileContent(page);
  const menu = page.getByRole('navigation', { name: COURIER_LAYOUT_TEXTS.NAV_LABEL });
  await expect(menu.getByRole('link', { name: COURIER_LAYOUT_TEXTS.NAV_PROFILE })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(menu.getByRole('link')).toHaveCount(3);
});
