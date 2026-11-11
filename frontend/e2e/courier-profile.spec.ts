import { expect, type Page, test } from '@playwright/test';
import { COURIER_LAYOUT_TEXTS } from '../src/app/layouts/courier-layout/navigation';
import { PROFILE_TEXTS } from '../src/pages/profile/config/texts';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { stubOrderLive } from './support/app-socket';
import { stubSession, STUB_EMAIL } from './support/stub-session';
import { buildOrderStubState, buildTestOrder, stubCourierOnOrder } from './support/courier-order';

// The courier opens the same profile page as the client, inside the frame of the cabinet. The
// session and the cabinet answers come from the stubbed API, so no seeded courier is needed.
async function expectProfileContent(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(PROFILE_TEXTS.PROFILE);
  await expect(page.getByText(`${PROFILE_TEXTS.PROFILE_EMAIL}: ${STUB_EMAIL}`)).toBeVisible();
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
  await stubOrderLive(page);
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
  await expect(menu.getByRole('link')).toHaveCount(4);
});
