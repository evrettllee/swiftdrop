import { expect, test } from '@playwright/test';
import { ORDER_COURIER_TEXTS } from '../src/pages/order/config/tracking';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { ORDER_JOIN_RETRY_FIRST_MS } from '../src/shared/realtime/order-join';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { getOrderPath } from '../src/shared/routes/app-routes';
import { LIVE_ORDER_ID, openLiveOrder, pushStatus, stubLiveOrder } from './support/live-order';

// The room of the order: the page takes the valid events of its own order only, joins the room again
// after a lost connection and loads what it missed, and does not insist on a room it is refused.
const OTHER_ORDER_ID = 990006;
// A taken event loads the order at once: a second is more than enough to tell it was not.
const EVENT_WAIT_MS = 1_000;

test('should leave out the events of another order and the broken ones', async ({ page }) => {
  const order = await stubLiveOrder(page);
  await openLiveOrder(page, order);
  const asked = order.requests;

  pushStatus(order, OTHER_ORDER_ID, ORDER_STATUS.COURIER_ASSIGNED);
  order.socket.push(SOCKET_EVENTS.ORDER_STATUS, { orderId: LIVE_ORDER_ID, status: 'lost' });

  await page.waitForTimeout(EVENT_WAIT_MS);
  expect(order.requests).toBe(asked);
  await expect(page.getByText(ORDER_COURIER_TEXTS.SEARCHING)).toBeVisible();
});

test('should join the room again and load the order after a lost connection', async ({ page }) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  await openLiveOrder(page, order);
  await expect(
    page.getByRole('heading', { name: ORDER_COURIER_TEXTS.SECTION, exact: true }),
  ).toBeVisible();
  const asked = order.requests;
  const joined = order.socket.joins.length;

  // The parcel was picked up while the page had no connection: its event is lost.
  order.status = ORDER_STATUS.PICKED_UP;
  await order.socket.drop();

  await expect.poll(() => order.socket.joins.slice(joined)).toContain(LIVE_ORDER_ID);
  await expect.poll(() => order.requests).toBeGreaterThan(asked);
  await expect(page.getByRole('group', { name: 'Код 4 8 2 7' })).toBeVisible();
});

test('should take an event once after the connection was lost twice', async ({ page }) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  await openLiveOrder(page, order);

  for (const round of [1, 2]) {
    const joined = order.socket.joins.length;
    await order.socket.drop();
    await expect.poll(() => order.socket.joins.length).toBeGreaterThan(joined);
    await expect.poll(() => order.requests).toBeGreaterThan(round);
  }
  const asked = order.requests;

  pushStatus(order, LIVE_ORDER_ID, ORDER_STATUS.PICKED_UP);

  await expect(page.getByRole('group', { name: 'Код 4 8 2 7' })).toBeVisible();
  expect(order.requests - asked).toBe(1);
});

test('should not ask again for a room of an order the backend does not find', async ({ page }) => {
  const order = await stubLiveOrder(page, { ok: false, reason: 'not_found' });
  await page.goto(getOrderPath(LIVE_ORDER_ID));
  await expect.poll(() => order.socket.joins).toContain(LIVE_ORDER_ID);

  // Past the first retry of a join that may pass.
  await page.waitForTimeout(ORDER_JOIN_RETRY_FIRST_MS + EVENT_WAIT_MS);

  expect(order.socket.joins).toEqual([LIVE_ORDER_ID]);
});

test('should ask again later for a room the backend could not check', async ({ page }) => {
  const order = await stubLiveOrder(page, { ok: false, reason: 'unavailable' });
  await page.goto(getOrderPath(LIVE_ORDER_ID));

  await expect
    .poll(() => order.socket.joins.length, { timeout: ORDER_JOIN_RETRY_FIRST_MS * 2 })
    .toBeGreaterThan(1);
});
