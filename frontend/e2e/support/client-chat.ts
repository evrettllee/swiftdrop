import type { Page } from '@playwright/test';
import { ORDER_COURIER_TEXTS } from '../../src/pages/order/config/tracking';
import { CHAT_SENDER_ROLE } from '../../src/shared/api/endpoints/chat';
import { ORDER_STATUS, type OrderStatus } from '../../src/shared/api/endpoints/order';
import { SOCKET_EVENTS } from '../../src/shared/realtime/socket-events';
import {
  type ChatBackend,
  type ChatMessageBody,
  chatMessage,
  createChatBackend,
  stubChatBackend,
} from './chat-backend';
import { LIVE_ORDER_ID, type LiveOrder, openLiveOrder, stubLiveOrder } from './live-order';
import { COURIER_NAME } from './order-details';

export type ClientChat = { order: LiveOrder; chat: ChatBackend };

export function courierMessages(count: number, firstId = 1): ChatMessageBody[] {
  return Array.from({ length: count }, (_, index) =>
    chatMessage(firstId + index, CHAT_SENDER_ROLE.COURIER, `Сообщение курьера ${firstId + index}`),
  );
}

export async function openClientChatOrder(
  page: Page,
  messages: ChatMessageBody[] = [],
  status: OrderStatus = ORDER_STATUS.COURIER_ASSIGNED,
): Promise<ClientChat> {
  const order = await stubLiveOrder(page);
  order.status = status;
  const chat = createChatBackend(CHAT_SENDER_ROLE.CLIENT, messages);
  await stubChatBackend(page, LIVE_ORDER_ID, chat);
  await openLiveOrder(page, order);

  return { order, chat };
}

export function pushChatMessage(order: LiveOrder, message: ChatMessageBody): void {
  order.socket.push(SOCKET_EVENTS.MESSAGE_NEW, { orderId: LIVE_ORDER_ID, message });
}

export function pushChatRead(order: LiveOrder, upToMessageId: number): void {
  order.socket.push(SOCKET_EVENTS.MESSAGE_READ, {
    orderId: LIVE_ORDER_ID,
    readerRole: CHAT_SENDER_ROLE.COURIER,
    upToMessageId,
  });
}

export async function setPageHidden(page: Page, isHidden: boolean): Promise<void> {
  await page.evaluate((hidden) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    document.dispatchEvent(new Event('visibilitychange'));
  }, isHidden);
}

export const clientChat = {
  button: (page: Page) => page.getByRole('button', { name: ORDER_COURIER_TEXTS.CHAT }),
  panel: (page: Page) => {
    const name = ORDER_COURIER_TEXTS.chatWith(COURIER_NAME);

    return page.getByRole('dialog', { name }).or(page.getByRole('region', { name, exact: true }));
  },
  log: (page: Page) => clientChat.panel(page).getByRole('log'),
  input: (page: Page) =>
    clientChat.panel(page).getByRole('textbox', { name: ORDER_COURIER_TEXTS.MESSAGE_LABEL }),
  quickReplies: (page: Page) => clientChat.panel(page).getByRole('group'),
};
