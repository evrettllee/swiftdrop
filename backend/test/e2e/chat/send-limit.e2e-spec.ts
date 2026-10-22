import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  CHAT_ERROR_MESSAGES,
  CHAT_SEND_THROTTLE_LIMIT,
} from '../../../src/modules/chat/constants/chat.constants';
import { ChatSendService } from '../../../src/modules/chat/services/chat-send.service';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import {
  assignCourier,
  countOrderMessages,
  placeConfirmedOrder,
  sendChatMessage,
} from '../../support/chat';
import { resetServiceArea } from '../../support/pricing';

// Its own app: the limit counts per user id in memory, and ids start again after a reset.
describe('Chat message limit (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse the 21st message of a user in a minute, the other side still sends', async () => {
    const { cookies: clientCookies } = await registerUser(app);
    const orderId = await placeConfirmedOrder(app, db, clientCookies);
    const courier = await assignCourier(app, db, orderId);

    for (let sent = 0; sent < CHAT_SEND_THROTTLE_LIMIT; sent += 1) {
      await sendChatMessage(app, clientCookies, orderId).expect(HttpStatus.CREATED);
    }
    const send = jest.spyOn(app.get(ChatSendService), 'send');
    const refused = await sendChatMessage(app, clientCookies, orderId).expect(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect(send).not.toHaveBeenCalled();
    send.mockRestore();

    await sendChatMessage(app, courier.cookies, orderId).expect(HttpStatus.CREATED);
    expect(refused.body.message).toBe(CHAT_ERROR_MESSAGES.TOO_MANY_MESSAGES);
    expect(await countOrderMessages(db, orderId)).toBe(CHAT_SEND_THROTTLE_LIMIT + 1);
  });
});
