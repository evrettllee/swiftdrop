import { expect, type Page, test } from '@playwright/test';
import { ROUTING_API_PATHS } from '../src/shared/api/endpoints/routing';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { APP_ROUTES } from '../src/shared/routes/app-routes';
import { ROLE } from '../src/shared/session/auth-user';
import { type AppSocketStub, stubOrderLive } from './support/app-socket';
import {
  buildOrderStubState,
  buildTestOrder,
  type OrderStubState,
  stubCourierOnOrder,
} from './support/courier-order';
import { stubMapbox } from './support/mapbox';
import {
  ENTRY_TICKET_ID,
  helpButton,
  openTicket,
  stubSupportPages,
  ticketRow,
} from './support/order-support-entry';
import { PARCEL_SEGMENT, stubRouteLines } from './support/routing';
import { stubSession } from './support/stub-session';

const ORDER_ID = 990331;

async function openWork(page: Page): Promise<{ state: OrderStubState; socket: AppSocketStub }> {
  const state = buildOrderStubState(buildTestOrder(ORDER_ID, ORDER_STATUS.IN_TRANSIT));
  await stubSession(page, ROLE.COURIER);
  const socket = await stubOrderLive(page);
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.COURIER_ORDER, () => [PARCEL_SEGMENT]);
  await stubCourierOnOrder(page, state);
  await stubSupportPages(page);
  await page.goto(APP_ROUTES.COURIER_WORK);
  await expect(page.getByRole('button', { name: 'Ввести код', exact: true })).toBeVisible();

  return { state, socket };
}

test('should offer help under the main action of the current order and open a new ticket', async ({
  page,
}) => {
  await openWork(page);

  await expect(helpButton(page)).toHaveCount(1);
  await expect(helpButton(page)).toHaveAttribute(
    'href',
    `${APP_ROUTES.COURIER_SUPPORT}?new=1&orderId=${ORDER_ID}`,
  );
  await helpButton(page).click();
  await expect(page.getByRole('dialog', { name: 'Новое обращение' })).toBeVisible();
});

test('should show the ticket of the courier and follow its reply', async ({ page }) => {
  const { state, socket } = await openWork(page);
  await expect(helpButton(page)).toBeVisible();

  state.order = {
    ...buildTestOrder(ORDER_ID, ORDER_STATUS.IN_TRANSIT),
    supportTicket: openTicket({ unreadCount: 1 }),
  };
  socket.push(SOCKET_EVENTS.SUPPORT_TICKET, {
    ticketId: ENTRY_TICKET_ID,
    kind: 'message',
    awaitingStaff: false,
    status: 'open',
  });

  await expect(ticketRow(page)).toHaveAccessibleName(
    'Обращение по заказу, Есть ответ поддержки, 15:21, 1 новое сообщение',
  );
  await expect(ticketRow(page)).toHaveAttribute(
    'href',
    `${APP_ROUTES.COURIER_SUPPORT}/${ENTRY_TICKET_ID}`,
  );
  await expect(helpButton(page)).toHaveCount(0);
});

test('should keep the help at the end of the order on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openWork(page);

  await expect(helpButton(page)).toBeVisible();
  await expect(helpButton(page)).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
