import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { SOCKET_EVENTS } from '@/modules/realtime/constants/socket-events.constants';
import { CHAT_ERROR_MESSAGES } from '@/modules/chat/constants/chat.constants';
import type {
  ChatHistory,
  MessageNewEvent,
  SentChatMessage,
} from '@/modules/chat/types/chat.types';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import {
  assignCourier,
  countOrderMessages,
  getChatHistory,
  OpenSockets,
  placeConfirmedOrder,
  sendChatMessage,
} from '@test/support/chat';
import { type Cookies, SECOND_CLIENT, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { collectEvents, joinOrderRoom, listenTestApp, roundTrip } from '@test/support/sockets';

describe('Sending a chat message (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  let clientCookies: Cookies;
  let courierCookies: Cookies;
  let orderId: number;
  const sockets = new OpenSockets();
  const getRoute = jest.fn();

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
  });

  afterEach(() => {
    sockets.closeAll();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should save the trimmed text of the client for the courier, unread', async () => {
    const unreadBefore = (await readHistory(courierCookies)).unreadCount;

    const response = await sendChatMessage(app, clientCookies, orderId, {
      content: '  Код домофона 25  ',
    }).expect(HttpStatus.CREATED);

    const { message } = response.body as SentChatMessage;
    expect(message).toEqual({
      messageId: expect.any(Number),
      senderRole: ROLE.CLIENT,
      content: 'Код домофона 25',
      sentAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.+Z$/),
      isRead: false,
    });
    const ofCourier = await readHistory(courierCookies);
    expect(ofCourier.items).toEqual([message]);
    expect(ofCourier.unreadCount).toBe(unreadBefore + 1);
  });

  it('should show the client a message of the courier as sent by the courier', async () => {
    const response = await sendChatMessage(app, courierCookies, orderId).expect(HttpStatus.CREATED);

    const { items } = await readHistory(clientCookies);
    expect(items).toEqual([(response.body as SentChatMessage).message]);
    expect(items[0].senderRole).toBe(ROLE.COURIER);
  });

  it('should send message:new to both sides in the room and to no one else', async () => {
    const client = await sockets.connect(baseUrl, clientCookies);
    const courier = await sockets.connect(baseUrl, courierCookies);
    const outsider = await sockets.connect(
      baseUrl,
      (await registerUser(app, SECOND_CLIENT)).cookies,
    );
    await Promise.all(
      [client, courier, outsider].map((socket) => joinOrderRoom(socket, { orderId })),
    );
    const received = [client, courier, outsider].map((socket) =>
      collectEvents<MessageNewEvent>(socket, SOCKET_EVENTS.MESSAGE_NEW),
    );

    const response = await sendChatMessage(app, clientCookies, orderId).expect(HttpStatus.CREATED);

    await Promise.all([client, courier, outsider].map((socket) => roundTrip(socket)));
    const event = { orderId, message: (response.body as SentChatMessage).message };
    expect(received).toEqual([[event], [event], []]);
  });

  it.each([ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED])(
    'should refuse with 409 once the order is %s and save nothing',
    async (status) => {
      await setOrderStatus(db, orderId, status);

      for (const cookies of [clientCookies, courierCookies]) {
        const response = await sendChatMessage(app, cookies, orderId).expect(HttpStatus.CONFLICT);

        expect(response.body.message).toBe(CHAT_ERROR_MESSAGES.CHAT_CLOSED);
      }
      expect(await countOrderMessages(db, orderId)).toBe(0);
    },
  );
});
