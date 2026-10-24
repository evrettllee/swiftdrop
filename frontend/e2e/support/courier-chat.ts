import type { Page } from '@playwright/test';
import { CHAT_SENDER_ROLE } from '../../src/shared/api/endpoints/chat';
import type { OrderStatus } from '../../src/shared/api/endpoints/order';
import { ROUTING_API_PATHS } from '../../src/shared/api/endpoints/routing';
import { ROLE } from '../../src/shared/session/auth-user';
import { type AppSocketStub, stubAppSocket } from './app-socket';
import {
  buildOrderStubState,
  buildTestOrder,
  type OrderStubState,
  stubCourierOnOrder,
} from './courier-order';
import { stubMapbox } from './mapbox';
import { PARCEL_SEGMENT, stubRouteLines } from './routing';
import { stubSession } from './stub-session';

export const CHAT_ORDER_ID = 990104;

export const CLIENT_MESSAGE = {
  messageId: 1,
  senderRole: CHAT_SENDER_ROLE.CLIENT,
  content: 'Подъезд со двора, домофон 13',
  sentAt: new Date().toISOString(),
  isRead: false,
};

export type CourierChatStub = {
  state: OrderStubState;
  socket: AppSocketStub;
  reads: number;
};

export async function stubCourierChat(page: Page, status: OrderStatus): Promise<CourierChatStub> {
  const stub: CourierChatStub = {
    state: buildOrderStubState(buildTestOrder(CHAT_ORDER_ID, status)),
    socket: await stubAppSocket(page),
    reads: 0,
  };

  await stubSession(page, ROLE.COURIER);
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.COURIER_ORDER, () => [PARCEL_SEGMENT]);
  await stubCourierOnOrder(page, stub.state);
  await page.route(/\/api\/orders\/\d+\/messages(\?.*)?$/, (route) =>
    route.fulfill({
      json: {
        items: [{ ...CLIENT_MESSAGE, isRead: stub.reads > 0 }],
        nextBeforeId: null,
        unreadCount: stub.reads > 0 ? 0 : 1,
        canSend: true,
      },
    }),
  );
  await page.route(/\/api\/orders\/\d+\/messages\/read$/, (route) => {
    stub.reads += 1;

    return route.fulfill({ json: { readCount: 1, unreadCount: 0 } });
  });

  return stub;
}
