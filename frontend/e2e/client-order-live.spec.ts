import { expect, type Page, test } from '@playwright/test';
import { ORDER_COURIER_TEXTS } from '../src/pages/order/config/tracking';
import { CHAT_SENDER_ROLE } from '../src/shared/api/endpoints/chat';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { MAP_CLASS, MAP_TEXTS } from '../src/shared/ui/route-map/map';
import { chatMessage, createChatBackend, stubChatBackend } from './support/chat-backend';
import {
  LIVE_ORDER_ID,
  type LiveOrder,
  openLiveOrder,
  pushStatus,
  stubLiveOrder,
} from './support/live-order';
import { TEST_ADDRESSES } from './support/mapbox';
import { PARCEL_SEGMENT, stubClientOrderRoute } from './support/routing';
import { fixClock, fromFixedNow, runClockFromFixedNow } from './support/clock';

const MINUTE = 60_000;
const STALE_MS = MINUTE;
const { SVERDLOVA } = TEST_ADDRESSES;
const EAST_OF_PICKUP = { latitude: SVERDLOVA.latitude, longitude: SVERDLOVA.longitude + 0.03 };
const WEST_OF_PICKUP = { latitude: SVERDLOVA.latitude, longitude: SVERDLOVA.longitude - 0.03 };

function orderMap(page: Page) {
  return page.getByRole('region', { name: MAP_TEXTS.VIEW_LABEL });
}

function courierMarker(page: Page) {
  return orderMap(page).locator(`.${MAP_CLASS.COURIER_ETA}`);
}

function statusLine(page: Page, title: string | RegExp) {
  return page.getByRole('heading', { level: 2, name: title });
}

function pushLocation(order: LiveOrder, point: { latitude: number; longitude: number }) {
  order.socket.push(SOCKET_EVENTS.COURIER_LOCATION, {
    orderId: LIVE_ORDER_ID,
    ...point,
    updatedAt: new Date().toISOString(),
  });
}

function pushEta(order: LiveOrder, pickupEtaAt: Date | null) {
  order.socket.push(SOCKET_EVENTS.ORDER_ETA, {
    orderId: LIVE_ORDER_ID,
    estimatedDeliveryAt: new Date(Date.now() + 40 * MINUTE).toISOString(),
    courierLeg: null,
    pickupEtaAt: pickupEtaAt?.toISOString() ?? null,
  });
}

async function courierSideOfPickup(page: Page): Promise<'east' | 'west' | null> {
  const pickup = orderMap(page)
    .locator(`.${MAP_CLASS.MARKER}`)
    .filter({ has: page.locator(`.${MAP_CLASS.DOT_PICKUP}`) });
  const [courierBox, pickupBox] = await Promise.all([
    courierMarker(page).boundingBox(),
    pickup.boundingBox(),
  ]);

  if (courierBox === null || pickupBox === null) {
    return null;
  }

  return courierBox.x > pickupBox.x ? 'east' : 'west';
}

async function openAssigned(page: Page): Promise<LiveOrder> {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  await openLiveOrder(page, order);

  return order;
}

test('should count the minutes to the pickup from order:eta on the status line and the marker', async ({
  page,
}) => {
  await fixClock(page);
  const order = await openAssigned(page);
  pushLocation(order, EAST_OF_PICKUP);

  pushEta(order, fromFixedNow(6 * MINUTE + 30_000));

  await expect(statusLine(page, 'Курьер приедет за посылкой через 7 мин')).toBeVisible();
  await expect(courierMarker(page).locator(`.${MAP_CLASS.COURIER_ETA_TEXT}`)).toHaveText('7 мин');
});

test('should move the marker of the courier with courier:location', async ({ page }) => {
  const order = await openAssigned(page);

  pushLocation(order, EAST_OF_PICKUP);
  await expect.poll(() => courierSideOfPickup(page)).toBe('east');

  pushLocation(order, WEST_OF_PICKUP);
  await expect.poll(() => courierSideOfPickup(page)).toBe('west');
});

test('should say the connection is lost a minute after the last position', async ({ page }) => {
  await runClockFromFixedNow(page);
  const order = await openAssigned(page);
  pushLocation(order, EAST_OF_PICKUP);
  await expect(courierMarker(page)).toBeVisible();

  await page.clock.runFor(STALE_MS - 1_000);
  await expect(statusLine(page, 'Нет связи с курьером')).toHaveCount(0);

  await page.clock.runFor(1_000);
  await expect(statusLine(page, 'Нет связи с курьером')).toBeVisible();
  await expect(courierMarker(page).locator(`.${MAP_CLASS.COURIER_ETA_TEXT}`)).toHaveText(
    ORDER_COURIER_TEXTS.MARKER_OFFLINE,
  );
});

test('should drop the position and the estimate of the courier once the order is over', async ({
  page,
}) => {
  const order = await openAssigned(page);
  const chat = createChatBackend(CHAT_SENDER_ROLE.CLIENT);
  await stubChatBackend(page, LIVE_ORDER_ID, chat);
  pushStatus(order, LIVE_ORDER_ID, ORDER_STATUS.DELIVERED);
  await expect(statusLine(page, /^Доставлен в \d{2}:\d{2}$/)).toBeVisible();

  pushLocation(order, EAST_OF_PICKUP);
  pushEta(order, new Date(Date.now() + 5 * MINUTE));
  order.socket.push(SOCKET_EVENTS.MESSAGE_NEW, {
    orderId: LIVE_ORDER_ID,
    message: { ...chatMessage(1, CHAT_SENDER_ROLE.COURIER, 'Спасибо!'), sentAt: new Date() },
  });

  await expect(page.getByRole('button', { name: ORDER_COURIER_TEXTS.CHAT })).toHaveText('1');
  await expect(statusLine(page, /^Доставлен в \d{2}:\d{2}$/)).toBeVisible();
  await expect(orderMap(page)).toHaveCount(0);
  await expect(page.getByText(/Курьер приедет за посылкой/)).toHaveCount(0);
});

test('should load the route and the chat again after the room is joined again', async ({
  page,
}) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  const routes = await stubClientOrderRoute(page, LIVE_ORDER_ID, () => [PARCEL_SEGMENT]);
  const chat = createChatBackend(CHAT_SENDER_ROLE.CLIENT);
  await stubChatBackend(page, LIVE_ORDER_ID, chat);
  await openLiveOrder(page, order);
  await expect.poll(() => chat.pages.length).toBeGreaterThan(0);
  const [routesBefore, pagesBefore, joined] = [
    routes.length,
    chat.pages.length,
    order.socket.joins.length,
  ];

  await order.socket.drop();

  await expect.poll(() => order.socket.joins.slice(joined)).toContain(LIVE_ORDER_ID);
  await expect.poll(() => routes.length).toBeGreaterThan(routesBefore);
  await expect.poll(() => chat.pages.length).toBeGreaterThan(pagesBefore);
});
