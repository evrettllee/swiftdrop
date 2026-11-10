import { expect, test } from '@playwright/test';
import { CHAT_SENDER_ROLE } from '../src/shared/api/endpoints/chat';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { chatMessage } from './support/chat-backend';
import {
  clientChat,
  courierMessages,
  openClientChatOrder,
  pushChatMessage,
} from './support/client-chat';
import { MAP_PATH, mapCouriers, pushLocation, stubCouriersMap } from './support/manager-map';
import { FIRST_ORDER_ID, pushStaffOrder, stubManagerOrders } from './support/manager-orders';
import { countRenders, rendersOf, resetRenders } from './support/render-counter';

const ROWS = 100;
const COURIERS = 50;
const LOCATION_EVENTS = 20;
const LOCATION_STEP_MS = 100;
const SETTLE_MS = 1_500;
const DESKTOP = { width: 1440, height: 1000 };

test.use({ viewport: DESKTOP });

test('should render only the changed rows of the orders table after staff:order', async ({
  page,
}) => {
  await countRenders(page);
  const stub = await stubManagerOrders(page);
  stub.total = ROWS;
  await page.goto(`${APP_ROUTES.MANAGER_ORDERS}?limit=${ROWS}`);
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(ROWS + 1);
  const lists = stub.lists.length;
  await resetRenders(page);

  pushStaffOrder(stub, 'status', FIRST_ORDER_ID);
  await expect.poll(() => stub.lists.length).toBeGreaterThan(lists);
  await page.waitForTimeout(SETTLE_MS);

  const rows = await rendersOf(page, 'OrderRow');
  test.info().annotations.push({ type: 'OrderRow renders', description: String(rows) });
  expect(rows).toBeLessThanOrEqual(1);
});

test('should render only the moved courier on a stream of positions', async ({ page }) => {
  await countRenders(page);
  const stub = await stubCouriersMap(page);
  const [first] = mapCouriers();
  stub.items = Array.from({ length: COURIERS }, (_, index) => ({
    ...first,
    courierId: index + 1,
    name: `Курьер ${index + 1}`,
    lat: 53.85 + index * 0.002,
    lng: 27.5 + index * 0.002,
  }));
  await page.goto(MAP_PATH);
  await expect(
    page.getByRole('region', { name: 'Курьеры на линии' }).getByRole('listitem'),
  ).toHaveCount(COURIERS);
  await page.waitForTimeout(SETTLE_MS);
  await resetRenders(page);

  for (let step = 0; step < LOCATION_EVENTS; step += 1) {
    pushLocation(stub, 1, 53.85 + step * 0.0005, 27.5);
    await page.waitForTimeout(LOCATION_STEP_MS);
  }
  await page.waitForTimeout(SETTLE_MS);

  const rows = await rendersOf(page, 'CourierRow');
  const pins = await rendersOf(page, 'CourierPin');
  test.info().annotations.push({ type: 'CourierRow renders', description: String(rows) });
  test.info().annotations.push({ type: 'CourierPin renders', description: String(pins) });
  expect(rows).toBeLessThanOrEqual(LOCATION_EVENTS);
  expect(pins).toBeLessThanOrEqual(LOCATION_EVENTS);
});

test('should render only the new message of the chat log', async ({ page }) => {
  await countRenders(page);
  const { order } = await openClientChatOrder(page, courierMessages(30));
  await clientChat.button(page).click();
  await expect(
    clientChat.log(page).getByText('Сообщение курьера 30', { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(SETTLE_MS);
  await resetRenders(page);

  pushChatMessage(order, chatMessage(31, CHAT_SENDER_ROLE.COURIER, 'Сообщение курьера 31'));
  await expect(
    clientChat.log(page).getByText('Сообщение курьера 31', { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(SETTLE_MS);

  const bubbles = await rendersOf(page, 'ChatBubble');
  test.info().annotations.push({ type: 'ChatBubble renders', description: String(bubbles) });
  expect(bubbles).toBeLessThanOrEqual(2);
});
