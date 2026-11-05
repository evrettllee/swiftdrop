import { expect, type Page, test } from '@playwright/test';
import { ORDER_COURIER_TEXTS } from '../src/pages/order/config/tracking';
import { CHAT_SENDER_ROLE } from '../src/shared/api/endpoints/chat';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { API_BASE_PATH } from '../src/shared/api/request-config';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { chatMessage, createChatBackend, stubChatBackend } from './support/chat-backend';
import {
  LIVE_ORDER_ID,
  type LiveOrder,
  openLiveOrder,
  pushStatus,
  stubLiveOrder,
} from './support/live-order';
import { buildTestOrderCourier, COURIER_NAME } from './support/order-details';

const NEW_COURIER_NAME = 'Олег К.';
const NEW_COURIER_ID = 990321;
const PHONE = { width: 375, height: 812 };

type CourierStub = { name: string; requests: number; hold: Promise<void> | null };

async function stubChangingCourier(page: Page, order: LiveOrder): Promise<CourierStub> {
  const stub: CourierStub = { name: COURIER_NAME, requests: 0, hold: null };

  await page.route(`**${API_BASE_PATH}/orders/${LIVE_ORDER_ID}/courier`, async (route) => {
    stub.requests += 1;
    await stub.hold;
    const answer = buildTestOrderCourier(order.status);

    return route.fulfill({
      json: {
        ...answer,
        courier: answer.courier === null ? null : { ...answer.courier, name: stub.name },
      },
    });
  });

  return stub;
}

function courierSection(page: Page) {
  return page.getByRole('heading', { name: ORDER_COURIER_TEXTS.SECTION, exact: true });
}

function pushCourier(order: LiveOrder, courierId: number | null): void {
  order.socket.push(SOCKET_EVENTS.ORDER_COURIER, { orderId: LIVE_ORDER_ID, courierId });
}

async function openAssignedOrder(page: Page): Promise<{ order: LiveOrder; courier: CourierStub }> {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  const courier = await stubChangingCourier(page, order);
  await openLiveOrder(page, order);
  await expect(page.getByText(COURIER_NAME)).toBeVisible();

  return { order, courier };
}

test('should show the new courier with a toast', async ({ page }) => {
  const { order, courier } = await openAssignedOrder(page);
  const requests = order.requests;
  courier.name = NEW_COURIER_NAME;

  pushCourier(order, NEW_COURIER_ID);

  await expect(page.getByText(ORDER_COURIER_TEXTS.CHANGED)).toBeVisible();
  await expect(page.getByText(NEW_COURIER_NAME)).toBeVisible();
  await expect(page.getByText(COURIER_NAME)).toHaveCount(0);
  expect(order.requests).toBe(requests + 1);
});

test('should look for a courier again with one reload for the courier and the status', async ({
  page,
}) => {
  const { order } = await openAssignedOrder(page);
  const requests = order.requests;

  pushCourier(order, null);
  pushStatus(order, LIVE_ORDER_ID, ORDER_STATUS.CONFIRMED);

  await expect(
    page.getByRole('heading', { level: 2, name: ORDER_COURIER_TEXTS.SEARCHING }),
  ).toBeVisible();
  await expect(courierSection(page)).toHaveCount(0);
  await page.waitForTimeout(1000);
  expect(order.requests).toBe(requests + 1);
  await expect(page.getByText(ORDER_COURIER_TEXTS.CHANGED)).toHaveCount(0);
});

test('should close the input of an open chat until the new courier comes', async ({ page }) => {
  await page.setViewportSize(PHONE);
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  const courier = await stubChangingCourier(page, order);
  await stubChatBackend(
    page,
    LIVE_ORDER_ID,
    createChatBackend(CHAT_SENDER_ROLE.CLIENT, [
      chatMessage(1, CHAT_SENDER_ROLE.COURIER, 'Еду к вам'),
    ]),
  );
  await openLiveOrder(page, order);
  await page.getByRole('button', { name: ORDER_COURIER_TEXTS.CHAT }).click();
  const input = page.getByRole('textbox', { name: ORDER_COURIER_TEXTS.MESSAGE_LABEL });
  await expect(input).toBeVisible();

  let release: () => void = () => undefined;
  courier.hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  courier.name = NEW_COURIER_NAME;
  pushCourier(order, NEW_COURIER_ID);

  await expect(page.getByText(ORDER_COURIER_TEXTS.CHANGED_IN_CHAT)).toBeVisible();
  await expect(input).toHaveCount(0);

  release();
  await expect(input).toBeVisible();
  await expect(page.getByText(ORDER_COURIER_TEXTS.CHANGED_IN_CHAT)).toHaveCount(0);
  await expect(page.getByText(NEW_COURIER_NAME).first()).toBeVisible();
});

test('should show the first courier without a toast', async ({ page }) => {
  const order = await stubLiveOrder(page);
  await stubChangingCourier(page, order);
  await openLiveOrder(page, order);

  pushCourier(order, NEW_COURIER_ID);
  pushStatus(order, LIVE_ORDER_ID, ORDER_STATUS.COURIER_ASSIGNED);

  await expect(page.getByText(COURIER_NAME)).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.getByText(ORDER_COURIER_TEXTS.CHANGED)).toHaveCount(0);
});
