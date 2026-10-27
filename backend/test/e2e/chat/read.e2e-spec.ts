import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Socket } from 'socket.io-client';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import type {
  ChatHistory,
  ChatReadResult,
  MessageReadEvent,
} from '@/modules/chat/types/chat.types';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import {
  assignCourier,
  getChatHistory,
  insertOrderMessages,
  markChatRead,
  OpenSockets,
  placeConfirmedOrder,
  type TestMessage,
} from '@test/support/chat';
import { type Cookies, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { collectEvents, joinOrderRoom, listenTestApp, roundTrip } from '@test/support/sockets';

const FROM_CLIENT: TestMessage = { from: ROLE.CLIENT };
const FROM_COURIER: TestMessage = { from: ROLE.COURIER };

describe('Marking chat messages read (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: Cookies;
  let courierCookies: Cookies;
  let orderId: number;
  // Two to the courier, one of the courier, two more to the courier.
  let ids: number[];
  let reads: MessageReadEvent[];
  let client: Socket;
  const sockets = new OpenSockets();
  const getRoute = jest.fn();

  async function markRead(cookies: Cookies, upToMessageId: number): Promise<ChatReadResult> {
    const response = await markChatRead(app, cookies, orderId, { upToMessageId }).expect(
      HttpStatus.OK,
    );

    return response.body as ChatReadResult;
  }

  async function readHistory(cookies: Cookies): Promise<ChatHistory> {
    return (await getChatHistory(app, cookies, orderId).expect(HttpStatus.OK)).body as ChatHistory;
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, clientCookies);
    ({ cookies: courierCookies } = await assignCourier(app, db, orderId));
    ids = await insertOrderMessages(db, orderId, [
      FROM_CLIENT,
      FROM_CLIENT,
      FROM_COURIER,
      FROM_CLIENT,
      FROM_CLIENT,
    ]);
    client = await sockets.connect(baseUrl, clientCookies);
    await joinOrderRoom(client, { orderId });
    reads = collectEvents<MessageReadEvent>(client, SOCKET_EVENTS.MESSAGE_READ);
  });

  afterEach(() => {
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should mark the messages to the courier up to the id and keep the later ones', async () => {
    expect(await markRead(courierCookies, ids[2])).toEqual({ readCount: 2, unreadCount: 2 });

    const { items } = await readHistory(courierCookies);
    expect(items.map((item) => item.isRead)).toEqual([true, true, false, false, false]);
  });

  it('should leave the own messages of the reader as they are', async () => {
    expect(await markRead(courierCookies, ids[4])).toEqual({ readCount: 4, unreadCount: 0 });

    expect((await readHistory(clientCookies)).unreadCount).toBe(1);
  });

  it('should tell the client up to the largest message the courier marked', async () => {
    await markRead(courierCookies, ids[2]);

    await roundTrip(client);
    expect(reads).toEqual([{ orderId, readerRole: ROLE.COURIER, upToMessageId: ids[1] }]);
  });

  it('should mark nothing and tell no one the second time', async () => {
    await markRead(courierCookies, ids[4]);

    expect(await markRead(courierCookies, ids[4])).toEqual({ readCount: 0, unreadCount: 0 });

    await roundTrip(client);
    expect(reads).toHaveLength(1);
  });

  it('should mark each message once when the same range is marked twice at once', async () => {
    const results = await Promise.all([
      markRead(courierCookies, ids[4]),
      markRead(courierCookies, ids[4]),
    ]);

    expect(results.reduce((sum, result) => sum + result.readCount, 0)).toBe(4);
    await roundTrip(client);
    expect(reads).toHaveLength(1);
  });

  it('should mark messages read after the delivery too', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.DELIVERED);

    expect(await markRead(courierCookies, ids[4])).toEqual({ readCount: 4, unreadCount: 0 });
  });
});
