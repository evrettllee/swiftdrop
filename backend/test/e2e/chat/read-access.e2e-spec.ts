import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { CHAT_ERROR_MESSAGES, CHAT_ROUTES } from '@/modules/chat/constants/chat.constants';
import { ChatReadService } from '@/modules/chat/services/chat-read.service';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { createTestApp } from '@test/support/app';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import {
  assignCourier,
  getChatHistory,
  insertOrderMessages,
  markChatRead,
  placeConfirmedOrder,
} from '@test/support/chat';
import { MISSING_ORDER_ID } from '@test/support/constants';
import { rawPostApi } from '@test/support/http';
import { type Cookies, SECOND_CLIENT } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { createUserWithRole, MANAGER_ACCOUNT } from '@test/support/users';

describe('Marking chat messages read: access and validation (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let orderId: number;
  let messageId: number;
  const getRoute = jest.fn();

  // A message of the courier to the client stays unread after a refused marking.
  async function expectStillUnread(): Promise<void> {
    const response = await getChatHistory(app, clientCookies, orderId).expect(HttpStatus.OK);

    expect(response.body.unreadCount).toBe(1);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, clientCookies);
    await assignCourier(app, db, orderId);
    [messageId] = await insertOrderMessages(db, orderId, [{ from: ROLE.COURIER }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should answer another client and a missing order with the 404 of the history', async () => {
    const { cookies } = await registerUser(app, SECOND_CLIENT);
    const body = { upToMessageId: messageId };

    const foreign = await markChatRead(app, cookies, orderId, body).expect(HttpStatus.NOT_FOUND);
    const missing = await markChatRead(app, cookies, MISSING_ORDER_ID, body).expect(
      HttpStatus.NOT_FOUND,
    );

    expect(foreign.body.message).toBe(CHAT_ERROR_MESSAGES.ORDER_NOT_FOUND);
    expect(missing.body).toEqual(foreign.body);
    await expectStillUnread();
  });

  it.each([
    ['no id', {}],
    ['a zero id', { upToMessageId: 0 }],
    ['a string id', { upToMessageId: '1' }],
    ['an unknown field', { upToMessageId: 1, all: true }],
  ])('should refuse %s with 400 before any query', async (_, body) => {
    const markRead = jest.spyOn(app.get(ChatReadService), 'markRead');

    await markChatRead(app, clientCookies, orderId, body).expect(HttpStatus.BAD_REQUEST);

    expect(markRead).not.toHaveBeenCalled();
  });

  it('should refuse a manager with 403', async () => {
    const cookies = await createUserWithRole(app, db, MANAGER_ACCOUNT, ROLE.MANAGER);

    await markChatRead(app, cookies, orderId, { upToMessageId: messageId }).expect(
      HttpStatus.FORBIDDEN,
    );
    await expectStillUnread();
  });

  it('should refuse a request without the CSRF header with 403', async () => {
    const path = `${CHAT_ROUTES.BASE}/${CHAT_ROUTES.READ.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    await rawPostApi(app, path)
      .set(COOKIE_HEADER, clientCookies)
      .send({ upToMessageId: messageId })
      .expect(HttpStatus.FORBIDDEN);

    await expectStillUnread();
  });
});
