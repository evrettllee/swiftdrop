import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { CHAT_ERROR_MESSAGES } from '@/modules/chat/constants/chat.constants';
import type { ChatHistory } from '@/modules/chat/types/chat.types';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import {
  countOrderMessages,
  getChatHistory,
  placeConfirmedOrder,
  sendChatMessage,
} from '@test/support/chat';
import { type Cookies, setOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

// The client writes before any courier took the order: the chat is not open yet, which is not the
// same as a finished order.
describe('Sending a chat message before a courier (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let orderId: number;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, clientCookies);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT])(
    'should refuse with 409 saying the chat opens with a courier while %s',
    async (status) => {
      await setOrderStatus(db, orderId, status);

      const response = await sendChatMessage(app, clientCookies, orderId).expect(
        HttpStatus.CONFLICT,
      );

      expect(response.body.message).toBe(CHAT_ERROR_MESSAGES.CHAT_NOT_OPEN);
      expect(await countOrderMessages(db, orderId)).toBe(0);
      const history = await getChatHistory(app, clientCookies, orderId).expect(HttpStatus.OK);
      expect((history.body as ChatHistory).canSend).toBe(false);
    },
  );

  it.each([ORDER_STATUS.CANCELLED, ORDER_STATUS.REJECTED])(
    'should refuse with 409 saying the chat is closed once the order is %s without a courier',
    async (status) => {
      await setOrderStatus(db, orderId, status);

      const response = await sendChatMessage(app, clientCookies, orderId).expect(
        HttpStatus.CONFLICT,
      );

      expect(response.body.message).toBe(CHAT_ERROR_MESSAGES.CHAT_CLOSED);
      expect(await countOrderMessages(db, orderId)).toBe(0);
    },
  );
});
