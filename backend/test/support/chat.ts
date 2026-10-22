import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Socket } from 'socket.io-client';
import { MS_PER_SECOND } from '../../src/common/constants/time.constants';
import { ORDER_STATUS } from '../../src/common/enums/order-status.enum';
import { ROLE } from '../../src/common/enums/role.enum';
import type { Database } from '../../src/database/database.module';
import { courierProfiles, messages, orders } from '../../src/database/schema';
import { CHAT_ROUTES } from '../../src/modules/chat/constants/chat.constants';
import type { ChatSenderRole } from '../../src/modules/chat/types/chat.types';
import { ORDER_ID_ROUTE_PARAM } from '../../src/modules/orders/constants/orders.constants';
import { COOKIE_HEADER } from './auth';
import { getApi, postApi } from './http';
import type {
  OrderJoinAck,
  OrderJoinRejection,
} from '../../src/modules/couriers/types/couriers-socket.types';
import { addCourierSession } from './assignment';
import { assignOrder, CAR, COURIER_ACCOUNT } from './couriers';
import { MINSK_PICKUP } from './fixtures';
import { type Cookies, placeOrders, setOrderStatus } from './orders';
import { connectAppSocket } from './sockets';

export const ORDER_JOIN_OK: OrderJoinAck = { ok: true };

export function orderJoinRefusal(reason: OrderJoinRejection): OrderJoinAck {
  return { ok: false, reason };
}

// The sockets a test opened, closed together after it.
export class OpenSockets {
  private readonly sockets: Socket[] = [];

  async connect(baseUrl: string, cookies: string): Promise<Socket> {
    const socket = await connectAppSocket(baseUrl, cookies);
    this.sockets.push(socket);

    return socket;
  }

  closeAll(): void {
    this.sockets.splice(0).forEach((socket) => socket.close());
  }
}

// An order of the client that waits for a courier.
export async function placeConfirmedOrder(
  app: NestExpressApplication,
  db: Database,
  cookies: Cookies,
): Promise<number> {
  const [orderId] = await placeOrders(app, cookies, 1);
  await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);

  return orderId;
}

export type TestMessage = { from: ChatSenderRole; isRead?: boolean };

// Messages of the order chat written straight to the database, one second apart, oldest first.
// The courier is the one assigned now. Gives the ids in the same order.
export async function insertOrderMessages(
  db: Database,
  orderId: number,
  list: readonly TestMessage[],
): Promise<number[]> {
  const [order] = await db
    .select({ clientId: orders.clientId, courierUserId: courierProfiles.userId })
    .from(orders)
    .innerJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
    .where(eq(orders.orderId, orderId));
  const startMs = Date.now() - list.length * MS_PER_SECOND;
  const rows = list.map(({ from, isRead = false }, index) => {
    const fromClient = from === ROLE.CLIENT;

    return {
      orderId,
      senderId: fromClient ? order.clientId : order.courierUserId,
      receiverId: fromClient ? order.courierUserId : order.clientId,
      content: `Сообщение ${index + 1}`,
      sentAt: new Date(startMs + index * MS_PER_SECOND),
      isRead,
    };
  });
  const inserted = await db.insert(messages).values(rows).returning({ id: messages.messageId });

  return inserted.map(({ id }) => id);
}

function messagesPath(orderId: number): string {
  return `${CHAT_ROUTES.BASE}/${CHAT_ROUTES.MESSAGES.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;
}

export function getChatHistory(
  app: NestExpressApplication,
  cookies: Cookies,
  orderId: number,
  query: Record<string, string | number> = {},
) {
  return getApi(app, messagesPath(orderId)).query(query).set(COOKIE_HEADER, cookies);
}

// The limit of messages counts per user id in the memory of the app, and the ids start again after
// a reset: a test file keeps the messages of one user under the limit, the limit has its own app.
export function sendChatMessage(
  app: NestExpressApplication,
  cookies: Cookies,
  orderId: number,
  body: object = { content: 'Я у подъезда' },
) {
  return postApi(app, messagesPath(orderId)).set(COOKIE_HEADER, cookies).send(body);
}

export async function countOrderMessages(db: Database, orderId: number): Promise<number> {
  return db.$count(messages, eq(messages.orderId, orderId));
}

// A courier on shift who has the order now, with the session cookies of that courier.
export async function assignCourier(
  app: NestExpressApplication,
  db: Database,
  orderId: number,
  account = COURIER_ACCOUNT,
): Promise<{ cookies: string; courierProfileId: number }> {
  const courier = await addCourierSession(app, db, account, CAR, MINSK_PICKUP);
  await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);

  return courier;
}
