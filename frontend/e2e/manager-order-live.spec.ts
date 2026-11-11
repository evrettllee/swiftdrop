import { expect, type Locator, type Page, test } from '@playwright/test';
import { MAP_CLASS, MAP_TEXTS } from '../src/shared/ui/route-map/map';
import { managerMenu } from './support/manager';
import {
  assignedOrder,
  awaitingOrder,
  COURIER_POINT,
  freshPosition,
  MANAGER_ORDER_ID,
  pushCourierLocation,
  pushOrderEvent,
  stubManagerOrder,
} from './support/manager-order';
import { fromFixedNow } from './support/clock';

const ORDER_PATH = `/manager/orders/${MANAGER_ORDER_ID}`;
const PHONE = { width: 375, height: 812 };
const BATCH_WAIT_MS = 1_000;

function courierMarker(page: Page): Locator {
  return page
    .getByRole('region', { name: MAP_TEXTS.VIEW_LABEL })
    .locator(`.${MAP_CLASS.COURIER_ETA}`);
}

function markerTransform(marker: Locator): Promise<string> {
  return marker.evaluate((element) => (element as HTMLElement).style.transform);
}

test('should read the order again after a change of this order only', async ({ page }) => {
  const stub = await stubManagerOrder(page, awaitingOrder());
  await page.goto(ORDER_PATH);
  await expect(
    page.getByRole('heading', { name: 'Автоназначение не нашло курьера' }),
  ).toBeVisible();
  const before = stub.orderRequests.length;

  pushOrderEvent(stub, MANAGER_ORDER_ID + 1);
  await page.waitForTimeout(BATCH_WAIT_MS);
  expect(stub.orderRequests).toHaveLength(before);

  stub.order = assignedOrder();
  pushOrderEvent(stub, MANAGER_ORDER_ID);
  pushOrderEvent(stub, MANAGER_ORDER_ID);
  await expect(page.getByRole('heading', { name: /Курьер приедет за посылкой/ })).toBeVisible();
  await page.waitForTimeout(BATCH_WAIT_MS);
  expect(stub.orderRequests).toHaveLength(before + 1);
});

test('should move the marker of the assigned courier and ignore other couriers', async ({
  page,
}) => {
  const stub = await stubManagerOrder(page, assignedOrder());
  stub.courierPosition = freshPosition();
  await page.goto(ORDER_PATH);

  const marker = courierMarker(page);
  await expect(marker).toHaveCount(1);
  await expect(marker.locator(`.${MAP_CLASS.COURIER_ETA_OFFLINE}`)).toHaveCount(0);
  await expect(marker).toHaveCSS('transition-duration', '1s');
  const start = await markerTransform(marker);

  stub.socket.push('staff:courier-location', {
    courierId: 999,
    lat: 53.95,
    lng: 27.6,
    at: fromFixedNow(0).toISOString(),
  });
  await page.waitForTimeout(BATCH_WAIT_MS);
  expect(await markerTransform(marker)).toBe(start);

  pushCourierLocation(stub, COURIER_POINT.latitude + 0.004, COURIER_POINT.longitude + 0.004);
  await expect.poll(() => markerTransform(marker)).not.toBe(start);
});

test('should jump without a transition when less motion is asked', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const stub = await stubManagerOrder(page, assignedOrder());
  stub.courierPosition = freshPosition();
  await page.goto(ORDER_PATH);

  await expect(courierMarker(page)).toHaveCSS('transition-duration', '0s');
});

test('should grey the marker out when the position is older than a minute', async ({ page }) => {
  const stub = await stubManagerOrder(page, assignedOrder());
  stub.courierPosition = {
    ...COURIER_POINT,
    updatedAt: fromFixedNow(-2 * 60_000).toISOString(),
    isStale: false,
  };
  await page.goto(ORDER_PATH);

  await expect(courierMarker(page).locator(`.${MAP_CLASS.COURIER_ETA_OFFLINE}`)).toHaveCount(1);
});

test('should show a missing order in the layout of the staff', async ({ page }) => {
  const stub = await stubManagerOrder(page, awaitingOrder());
  stub.status = 404;
  await page.goto(ORDER_PATH);

  await expect(page.getByRole('heading', { name: 'Заказ не найден' })).toBeVisible();
  await expect(managerMenu(page)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Все заказы' })).toHaveAttribute(
    'href',
    '/manager/orders',
  );

  await page.goto('/manager/orders/abc');
  await expect(page.getByRole('heading', { name: 'Заказ не найден' })).toBeVisible();
});

test('should offer to try again after a failed request', async ({ page }) => {
  const stub = await stubManagerOrder(page, awaitingOrder());
  stub.status = 503;
  await page.goto(ORDER_PATH);

  await expect(page.getByRole('alert')).toContainText('Не удалось загрузить заказ');
  stub.status = 200;
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(
    page.getByRole('heading', { name: 'Автоназначение не нашло курьера' }),
  ).toBeVisible();
});

test('should put the actions and the tickets after the status line and the payment last on a phone', async ({
  page,
}) => {
  await page.setViewportSize(PHONE);
  await stubManagerOrder(page, assignedOrder());
  await page.goto(ORDER_PATH);

  await expect(page.getByRole('link', { name: 'Все заказы' })).toBeVisible();
  const tops = await Promise.all(
    [
      /Курьер приедет за посылкой/,
      'Действия',
      'Обращения по заказу',
      'Маршрут',
      'Клиент',
      'Курьер',
      'Получатель и посылка',
      'Предложения курьерам',
      'Ход заказа',
      'Оплата',
    ].map(async (name) => {
      const box = await page.getByRole('heading', { level: 2, name, exact: true }).boundingBox();

      return box?.y ?? Number.NaN;
    }),
  );

  expect(tops).toEqual([...tops].sort((first, second) => first - second));
  await expect(
    page.getByRole('region', { name: 'Курьер', exact: true }).getByText('Легковой, 4521 KE-7'),
  ).toBeVisible();
  await expect(page.getByRole('table')).toBeHidden();
});
