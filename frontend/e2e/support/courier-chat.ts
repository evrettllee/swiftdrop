import type { Page } from '@playwright/test';
import { CHAT_SENDER_ROLE } from '../../src/shared/api/endpoints/chat';
import type { OrderStatus } from '../../src/shared/api/endpoints/order';
import { ROUTING_API_PATHS } from '../../src/shared/api/endpoints/routing';
import { ROLE } from '../../src/shared/session/auth-user';
import { type AppSocketStub, stubAppSocket } from './app-socket';
import { type ChatBackend, chatMessage, createChatBackend, stubChatBackend } from './chat-backend';
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

export const CLIENT_MESSAGE = chatMessage(
  1,
  CHAT_SENDER_ROLE.CLIENT,
  'Подъезд со двора, домофон 13',
);

export type CourierChatStub = {
  state: OrderStubState;
  socket: AppSocketStub;
  chat: ChatBackend;
};

export async function stubCourierChat(page: Page, status: OrderStatus): Promise<CourierChatStub> {
  const stub: CourierChatStub = {
    state: buildOrderStubState(buildTestOrder(CHAT_ORDER_ID, status)),
    socket: await stubAppSocket(page),
    chat: createChatBackend(CHAT_SENDER_ROLE.COURIER, [{ ...CLIENT_MESSAGE }]),
  };

  await stubSession(page, ROLE.COURIER);
  await stubMapbox(page);
  await stubRouteLines(page, ROUTING_API_PATHS.COURIER_ORDER, () => [PARCEL_SEGMENT]);
  await stubCourierOnOrder(page, stub.state);
  await stubChatBackend(page, CHAT_ORDER_ID, stub.chat);

  return stub;
}
