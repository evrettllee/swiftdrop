import { expect, test } from '@playwright/test';
import { ORDER_COURIER_TEXTS } from '../src/pages/order/config/tracking';
import { CHAT_SENDER_ROLE } from '../src/shared/api/endpoints/chat';
import { ORDER_STATUS } from '../src/shared/api/endpoints/order';
import { SOCKET_EVENTS } from '../src/shared/realtime/socket-events';
import { LIVE_ORDER_ID, openLiveOrder, stubLiveOrder } from './support/live-order';
import { COURIER_NAME } from './support/order-details';

const TEXT = 'Я на месте, жду';

test('should show the message of the courier in a toast while the chat is closed', async ({
  page,
}) => {
  const order = await stubLiveOrder(page);
  order.status = ORDER_STATUS.COURIER_ASSIGNED;
  await openLiveOrder(page, order);
  const toast = page.getByRole('status').filter({ hasText: COURIER_NAME });

  order.socket.push(SOCKET_EVENTS.MESSAGE_NEW, {
    orderId: LIVE_ORDER_ID,
    message: {
      messageId: 1,
      senderRole: CHAT_SENDER_ROLE.COURIER,
      content: TEXT,
      sentAt: new Date().toISOString(),
      isRead: false,
    },
  });

  await expect(toast).toContainText(TEXT);
  await expect(page.getByRole('button', { name: ORDER_COURIER_TEXTS.CHAT })).toHaveText('1');
  await toast.getByRole('button', { name: 'Ответить' }).click();
  await expect(page).toHaveURL(/[?&]chat=1(&|$)/);
  await expect(toast).toHaveCount(0);
});
