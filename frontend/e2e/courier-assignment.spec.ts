import { expect, type Page, test } from '@playwright/test';
import { ASSIGNMENT_TEXTS, OFFER_TEXTS } from '../src/features/order-offer/config/texts';
import { LINE_TEXTS, ORDER_STEP_TEXTS, ORDER_TEXTS } from '../src/pages/courier-work/config/texts';
import { COURIER_ORDERS_API_PATHS } from '../src/shared/api/endpoints/courier-order';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { CITY_CENTER } from '../src/shared/config/map';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import {
  ASSIGNED_ORDER_ID,
  assignOrder,
  openCourierCabinet,
  unassignOrder,
} from './support/courier-assignment';
import { buildTestOffer } from './support/offers';

const [LATITUDE, LONGITUDE] = CITY_CENTER;
const OFFER_ID = 990552;
const ORDER_NUMBER = `№${ASSIGNED_ORDER_ID}`;

test.use({
  geolocation: { latitude: LATITUDE, longitude: LONGITUDE },
  permissions: ['geolocation'],
});

function toast(page: Page, text: string) {
  return page.getByText(text, { exact: true });
}

function lineTitle(page: Page) {
  return page.getByText(LINE_TEXTS.ONLINE_TITLE, { exact: true });
}

function orderTitle(page: Page) {
  return page.getByRole('heading', { name: ORDER_STEP_TEXTS.TO_PICKUP });
}

test('should show the assigned order on the work page and close the open offer', async ({
  page,
}) => {
  const cabinet = await openCourierCabinet(page, APP_ROUTES.COURIER_WORK);
  await expect(lineTitle(page)).toBeVisible();
  cabinet.socket.push(SOCKET_EVENTS.OFFER_NEW, buildTestOffer(OFFER_ID));
  const offer = page.getByRole('dialog', { name: OFFER_TEXTS.TITLE });
  await expect(offer).toBeVisible();

  assignOrder(cabinet);

  await expect(offer).toBeHidden();
  await expect(toast(page, ASSIGNMENT_TEXTS.assigned(ORDER_NUMBER))).toBeVisible();
  await expect(page.getByRole('button', { name: ASSIGNMENT_TEXTS.OPEN })).toHaveCount(0);
  await expect(orderTitle(page)).toBeVisible();

  cabinet.socket.push(SOCKET_EVENTS.OFFER_CLOSED, { offerId: OFFER_ID });
  await expect(toast(page, ASSIGNMENT_TEXTS.assigned(ORDER_NUMBER))).toBeVisible();
});

test('should offer to open the assigned order from another page', async ({ page }) => {
  const cabinet = await openCourierCabinet(page, APP_ROUTES.COURIER_HISTORY);
  await expect(page.getByRole('heading', { level: 1, name: 'История' })).toBeVisible();

  assignOrder(cabinet);

  await expect(toast(page, ASSIGNMENT_TEXTS.assigned(ORDER_NUMBER))).toBeVisible();
  await expect(page).toHaveURL(APP_ROUTES.COURIER_HISTORY);
  await page.getByRole('button', { name: ASSIGNMENT_TEXTS.OPEN }).click();

  await expect(page).toHaveURL(APP_ROUTES.COURIER_WORK);
  await expect(orderTitle(page)).toBeVisible();
});

test('should go back to the line when the order is given to another courier', async ({ page }) => {
  const cabinet = await openCourierCabinet(
    page,
    `${APP_ROUTES.COURIER_WORK}?chat=1`,
    ORDER_STATUS.COURIER_ASSIGNED,
  );
  await expect(orderTitle(page)).toBeVisible();
  await page.route(`**${API_BASE_PATH}${COURIER_ORDERS_API_PATHS.CURRENT}*`, (route) =>
    route.fulfill({ status: 403, json: { message: 'Заказ назначен другому курьеру' } }),
  );

  unassignOrder(cabinet);

  await expect(toast(page, ASSIGNMENT_TEXTS.unassigned(ORDER_NUMBER))).toBeVisible();
  await expect(lineTitle(page)).toBeVisible();
  await expect(page).toHaveURL(APP_ROUTES.COURIER_WORK);
  await expect(page.getByText(ORDER_TEXTS.LOAD_ERROR)).toHaveCount(0);
  await expect(page.getByText('Заказ назначен другому курьеру')).toHaveCount(0);
});

test('should leave the code screen for the line when the order is taken away', async ({ page }) => {
  const cabinet = await openCourierCabinet(page, APP_ROUTES.COURIER_WORK, ORDER_STATUS.IN_TRANSIT);
  await page.getByRole('button', { name: ORDER_STEP_TEXTS.ENTER_CODE }).click();
  await expect(page.getByRole('heading', { name: 'Код доставки' })).toBeVisible();

  unassignOrder(cabinet);

  await expect(toast(page, ASSIGNMENT_TEXTS.unassigned(ORDER_NUMBER))).toBeVisible();
  await expect(lineTitle(page)).toBeVisible();
});

test('should close a closed offer with a notice', async ({ page }) => {
  const cabinet = await openCourierCabinet(page, APP_ROUTES.COURIER_WORK);
  await expect(lineTitle(page)).toBeVisible();
  cabinet.socket.push(SOCKET_EVENTS.OFFER_NEW, buildTestOffer(OFFER_ID));
  const offer = page.getByRole('dialog', { name: OFFER_TEXTS.TITLE });
  await expect(offer).toBeVisible();

  cabinet.socket.push(SOCKET_EVENTS.OFFER_CLOSED, { offerId: OFFER_ID });

  await expect(offer).toBeHidden();
  await expect(toast(page, 'Заказ уже недоступен')).toBeVisible();
});
