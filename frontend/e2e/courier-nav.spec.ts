import { expect, test } from '@playwright/test';
import { COURIER_LAYOUT_TEXTS } from '../src/app/layouts/courier-layout/navigation';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { APP_ROUTES, getCourierHistoryOrderPath } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { stubMapbox } from './support/mapbox';
import { buildOrderStubState, buildTestOrder, stubCourierOnOrder } from './support/courier-order';
import { answerAs, stubHistoryOrder } from './support/courier-history-order';
import { PARCEL_SEGMENT, stubRouteLines } from './support/routing';
import { stubOrderLive } from './support/app-socket';
import { stubSession } from './support/stub-session';

// The menu of the cabinet on pages that stand for one of its items: the item is highlighted and
// tells it to assistive technology too. The session and the answers come from the stubs.
const HISTORY_ORDER_ID = 990008;

test.beforeEach(async ({ page }) => {
  await stubSession(page, ROLE.COURIER);
  await stubOrderLive(page);
  await stubMapbox(page);
  await stubCourierOnOrder(
    page,
    buildOrderStubState(buildTestOrder(HISTORY_ORDER_ID, ORDER_STATUS.COURIER_ASSIGNED)),
  );
});

function menuLink(page: Parameters<Parameters<typeof test>[2]>[0]['page'], name: string) {
  return page
    .getByRole('navigation', { name: COURIER_LAYOUT_TEXTS.NAV_LABEL })
    .getByRole('link', { name });
}

test('should mark the work item current on the vehicle page', async ({ page }) => {
  await page.goto(APP_ROUTES.COURIER_VEHICLE);

  await expect(menuLink(page, COURIER_LAYOUT_TEXTS.NAV_WORK)).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(menuLink(page, COURIER_LAYOUT_TEXTS.NAV_HISTORY)).not.toHaveAttribute(
    'aria-current',
  );
});

test('should mark the history item current on the page of a finished order', async ({ page }) => {
  const orderId = HISTORY_ORDER_ID + 1;
  await stubRouteLines(page, ROUTING_API_PATHS.courierHistoryOrder(orderId), () => [
    PARCEL_SEGMENT,
  ]);
  await stubHistoryOrder(page, () => answerAs(ORDER_STATUS.DELIVERED));
  await page.goto(getCourierHistoryOrderPath(orderId));

  await expect(menuLink(page, COURIER_LAYOUT_TEXTS.NAV_HISTORY)).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(menuLink(page, COURIER_LAYOUT_TEXTS.NAV_WORK)).not.toHaveAttribute('aria-current');
});
