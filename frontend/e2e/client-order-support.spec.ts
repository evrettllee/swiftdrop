import { expect, test } from '@playwright/test';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { LIVE_ORDER_ID, openLiveOrder, stubLiveOrder } from './support/live-order';
import {
  ENTRY_TICKET_ID,
  helpButton,
  openTicket,
  stubSupportPages,
  ticketRow,
} from './support/order-support-entry';

test('should offer help under the payment of an order without a ticket and open a new one', async ({
  page,
}) => {
  const order = await stubLiveOrder(page);
  await stubSupportPages(page);
  await openLiveOrder(page, order);

  const panel = page.getByRole('complementary', { name: 'Оплата' });
  await expect(panel.getByRole('link', { name: 'Нужна помощь с заказом' })).toBeVisible();
  await expect(ticketRow(page)).toHaveCount(0);

  await helpButton(page).click();
  await expect(page).toHaveURL(`/support?new=1&orderId=${LIVE_ORDER_ID}`);
  await expect(page.getByRole('dialog', { name: 'Новое обращение' })).toBeVisible();

  order.supportTicket = openTicket({ awaitingStaff: true });
  await page.goBack();
  await expect(page).toHaveURL(`/orders/${LIVE_ORDER_ID}`);
  await expect(ticketRow(page)).toHaveAccessibleName(
    'Обращение по заказу, Ждёт ответа поддержки, 15:21',
  );
  await expect(helpButton(page)).toHaveCount(0);
});

test('should lead from the ticket of the order to its thread with the unread replies', async ({
  page,
}) => {
  const order = await stubLiveOrder(page);
  order.supportTicket = openTicket({ unreadCount: 2 });
  await stubSupportPages(page);
  await openLiveOrder(page, order);

  const row = page.getByRole('complementary', { name: 'Оплата' }).getByRole('link', {
    name: /^Обращение по заказу/,
  });
  await expect(row).toHaveAccessibleName(
    'Обращение по заказу, Есть ответ поддержки, 15:21, 2 новых сообщения',
  );
  await expect(row).toContainText('Есть ответ поддержки, 15:21');
  await expect(row).toContainText('2');
  await expect(row).toHaveAttribute('href', `/support/${ENTRY_TICKET_ID}`);
});

test('should show the reply of the support on the order at once and tell about it', async ({
  page,
}) => {
  const order = await stubLiveOrder(page);
  await openLiveOrder(page, order);
  await expect(helpButton(page)).toBeVisible();

  order.supportTicket = openTicket({ unreadCount: 1 });
  order.socket.push(SOCKET_EVENTS.SUPPORT_TICKET, {
    ticketId: ENTRY_TICKET_ID,
    kind: 'message',
    awaitingStaff: false,
    status: 'open',
  });

  await expect(ticketRow(page)).toContainText('Есть ответ поддержки');
  await expect(page.getByRole('status').filter({ hasText: 'Поддержка ответила' })).toBeVisible();

  order.supportTicket = null;
  order.socket.push(SOCKET_EVENTS.SUPPORT_TICKET, {
    ticketId: ENTRY_TICKET_ID,
    kind: 'closed',
    awaitingStaff: false,
    status: 'closed',
  });
  await expect(helpButton(page)).toBeVisible();
});

test('should offer help on a delivered and on a cancelled order', async ({ page }) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.DELIVERED;
  await openLiveOrder(page, order);
  await expect(helpButton(page)).toBeVisible();

  order.status = ORDER_STATUS.CANCELLED;
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(helpButton(page)).toBeVisible();
});

test('should keep the help at the end of the payment on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const order = await stubLiveOrder(page);
  await openLiveOrder(page, order);

  const panel = page.getByRole('complementary', { name: 'Оплата' });
  await expect(panel.getByRole('link', { name: 'Нужна помощь с заказом' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
