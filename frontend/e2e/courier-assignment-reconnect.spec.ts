import { expect, type Page, test } from '@playwright/test';
import { ASSIGNMENT_TEXTS } from '../src/features/order-offer/config/texts';
import { LINE_TEXTS, ORDER_STEP_TEXTS } from '../src/pages/courier-work/config/texts';
import { COURIER_ORDERS_API_PATHS } from '../src/shared/api/endpoints/courier-order';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { CITY_CENTER } from '../src/shared/config/map';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  ASSIGNED_ORDER_ID,
  type CourierCabinet,
  giveOrder,
  openCourierCabinet,
} from './support/courier-assignment';
import { historyOrderBody } from './support/courier-history-order';

const [LATITUDE, LONGITUDE] = CITY_CENTER;
const ORDER_NUMBER = `№${ASSIGNED_ORDER_ID}`;
const HTTP_NOT_FOUND = 404;

test.use({
  geolocation: { latitude: LATITUDE, longitude: LONGITUDE },
  permissions: ['geolocation'],
});

async function loseConnection(cabinet: CourierCabinet, change: () => void): Promise<void> {
  await expect.poll(() => cabinet.socket.sent.some((frame) => frame.startsWith('40'))).toBe(true);
  change();
  await cabinet.socket.drop();
}

async function answerHistoryOrder(page: Page, status: number, json: object): Promise<void> {
  await page.route(
    `**${API_BASE_PATH}${COURIER_ORDERS_API_PATHS.historyOrder(ASSIGNED_ORDER_ID)}`,
    (route) => route.fulfill({ status, json }),
  );
}

function takeOrderAway({ state }: CourierCabinet): void {
  state.order = null;
  state.profile = { ...state.profile, activeOrderId: null };
}

function lineTitle(page: Page) {
  return page.getByText(LINE_TEXTS.ONLINE_TITLE, { exact: true });
}

test('should tell about the order assigned while the connection was lost', async ({ page }) => {
  const cabinet = await openCourierCabinet(page, APP_ROUTES.COURIER_WORK);
  await expect(lineTitle(page)).toBeVisible();

  await loseConnection(cabinet, () => giveOrder(cabinet.state));

  await expect(page.getByRole('heading', { name: ORDER_STEP_TEXTS.TO_PICKUP })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(ASSIGNMENT_TEXTS.assigned(ORDER_NUMBER))).toBeVisible();
});

test('should tell about the order taken away while the connection was lost', async ({ page }) => {
  const cabinet = await openCourierCabinet(
    page,
    APP_ROUTES.COURIER_WORK,
    ORDER_STATUS.COURIER_ASSIGNED,
  );
  await answerHistoryOrder(page, HTTP_NOT_FOUND, { message: 'Заказ не найден' });
  await expect(page.getByRole('heading', { name: ORDER_STEP_TEXTS.TO_PICKUP })).toBeVisible();

  await loseConnection(cabinet, () => takeOrderAway(cabinet));

  await expect(lineTitle(page)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(ASSIGNMENT_TEXTS.unassigned(ORDER_NUMBER))).toBeVisible();
});

test('should not call a cancelled order given to another courier', async ({ page }) => {
  const cabinet = await openCourierCabinet(
    page,
    APP_ROUTES.COURIER_WORK,
    ORDER_STATUS.COURIER_ASSIGNED,
  );
  await answerHistoryOrder(page, 200, historyOrderBody(ASSIGNED_ORDER_ID, ORDER_STATUS.CANCELLED));
  await expect(page.getByRole('heading', { name: ORDER_STEP_TEXTS.TO_PICKUP })).toBeVisible();
  const historyAnswer = page.waitForResponse((response) =>
    response.url().endsWith(COURIER_ORDERS_API_PATHS.historyOrder(ASSIGNED_ORDER_ID)),
  );

  await loseConnection(cabinet, () => takeOrderAway(cabinet));

  await expect(lineTitle(page)).toBeVisible({ timeout: 15_000 });
  await historyAnswer;
  await page.waitForTimeout(500);
  await expect(page.getByText(ASSIGNMENT_TEXTS.unassigned(ORDER_NUMBER))).toHaveCount(0);
});
