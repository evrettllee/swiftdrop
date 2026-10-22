import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '../../../src/common/enums/role.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  CHAT_ERROR_MESSAGES,
  CHAT_ROUTES,
} from '../../../src/modules/chat/constants/chat.constants';
import { ChatSendService } from '../../../src/modules/chat/services/chat-send.service';
import { ORDER_ID_ROUTE_PARAM } from '../../../src/modules/orders/constants/orders.constants';
import { createTestApp } from '../../support/app';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import {
  assignCourier,
  countOrderMessages,
  placeConfirmedOrder,
  sendChatMessage,
} from '../../support/chat';
import { MISSING_ORDER_ID } from '../../support/constants';
import { rawPostApi } from '../../support/http';
import { type Cookies, SECOND_CLIENT } from '../../support/orders';
import { resetServiceArea } from '../../support/pricing';
import { createUserWithRole, MANAGER_ACCOUNT } from '../../support/users';

// Every request below counts against the limit of the same client id: fewer than 20 in this file.
describe('Chat message access and validation (e2e)', () => {
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
    await assignCourier(app, db, orderId);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['an empty text', { content: '' }],
    ['only spaces', { content: '   ' }],
    ['1001 characters', { content: 'ж'.repeat(1001) }],
    ['the NUL character', { content: 'a\u0000b' }],
    ['a number', { content: 7 }],
    ['an unknown field', { content: 'Привет', isRead: true }],
  ])('should refuse %s with 400 and save nothing', async (_, body) => {
    const send = jest.spyOn(app.get(ChatSendService), 'send');

    await sendChatMessage(app, clientCookies, orderId, body).expect(HttpStatus.BAD_REQUEST);

    expect(send).not.toHaveBeenCalled();
    expect(await countOrderMessages(db, orderId)).toBe(0);
  });

  it('should answer another client and a missing order with the 404 of the history', async () => {
    const { cookies } = await registerUser(app, SECOND_CLIENT);

    const foreign = await sendChatMessage(app, cookies, orderId).expect(HttpStatus.NOT_FOUND);
    const missing = await sendChatMessage(app, cookies, MISSING_ORDER_ID).expect(
      HttpStatus.NOT_FOUND,
    );

    expect(foreign.body.message).toBe(CHAT_ERROR_MESSAGES.ORDER_NOT_FOUND);
    expect(missing.body).toEqual(foreign.body);
    expect(await countOrderMessages(db, orderId)).toBe(0);
  });

  it('should refuse a manager with 403', async () => {
    const cookies = await createUserWithRole(app, db, MANAGER_ACCOUNT, ROLE.MANAGER);

    await sendChatMessage(app, cookies, orderId).expect(HttpStatus.FORBIDDEN);
  });

  it('should refuse a request without the CSRF header with 403', async () => {
    const path = `${CHAT_ROUTES.BASE}/${CHAT_ROUTES.MESSAGES.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    await rawPostApi(app, path)
      .set(COOKIE_HEADER, clientCookies)
      .send({ content: 'Привет' })
      .expect(HttpStatus.FORBIDDEN);

    expect(await countOrderMessages(db, orderId)).toBe(0);
  });
});
