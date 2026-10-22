import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '../../../src/common/enums/role.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { CHAT_SOCKET_EVENTS } from '../../../src/modules/chat/constants/chat.constants';
import type {
  ChatHistory,
  MessageNewEvent,
  MessageReadEvent,
} from '../../../src/modules/chat/types/chat.types';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import {
  assignCourier,
  getChatHistory,
  markChatRead,
  OpenSockets,
  placeConfirmedOrder,
  sendChatMessage,
} from '../../support/chat';
import { resetServiceArea } from '../../support/pricing';
import { joinOrderRoom, listenTestApp, waitForEvent } from '../../support/sockets';

describe('Chat over the order room (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let baseUrl: string;
  const sockets = new OpenSockets();
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    baseUrl = await listenTestApp(app);
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    sockets.closeAll();
    await app.close();
  });

  it('should carry a message to the courier and its reading back to the client', async () => {
    const { cookies: clientCookies } = await registerUser(app);
    const orderId = await placeConfirmedOrder(app, db, clientCookies);
    const { cookies: courierCookies } = await assignCourier(app, db, orderId);
    const client = await sockets.connect(baseUrl, clientCookies);
    const courier = await sockets.connect(baseUrl, courierCookies);
    await joinOrderRoom(client, { orderId });
    await joinOrderRoom(courier, { orderId });

    const arrived = waitForEvent<MessageNewEvent>(courier, CHAT_SOCKET_EVENTS.MESSAGE_NEW);
    await sendChatMessage(app, clientCookies, orderId, { content: 'Подъезд 3' }).expect(
      HttpStatus.CREATED,
    );
    const { message } = await arrived;
    expect(message).toMatchObject({ senderRole: ROLE.CLIENT, content: 'Подъезд 3' });

    const seen = waitForEvent<MessageReadEvent>(client, CHAT_SOCKET_EVENTS.MESSAGE_READ);
    await markChatRead(app, courierCookies, orderId, { upToMessageId: message.messageId }).expect(
      HttpStatus.OK,
    );
    expect(await seen).toEqual({
      orderId,
      readerRole: ROLE.COURIER,
      upToMessageId: message.messageId,
    });

    const history = await getChatHistory(app, clientCookies, orderId).expect(HttpStatus.OK);
    expect((history.body as ChatHistory).items).toEqual([{ ...message, isRead: true }]);
  });
});
