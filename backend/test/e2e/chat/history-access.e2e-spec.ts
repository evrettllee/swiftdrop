import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { CHAT_PAGE_SIZE_MAX } from '@/modules/chat/constants/chat.constants';
import { ChatHistoryService } from '@/modules/chat/services/chat-history.service';
import { ORDERS_ROUTES } from '@/modules/orders/constants/orders.constants';
import { createTestApp } from '@test/support/app';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignCourier, getChatHistory, placeConfirmedOrder } from '@test/support/chat';
import { MISSING_ORDER_ID } from '@test/support/constants';
import { CAR, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { getApi } from '@test/support/http';
import { type Cookies, SECOND_CLIENT } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';
import { createUserWithRole, MANAGER_ACCOUNT } from '@test/support/users';

describe('Chat history access (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let orderId: number;
  const getRoute = jest.fn();

  // The answer GET /orders/:id gives a client for an order that is not theirs.
  async function foreignOrderAnswer(cookies: Cookies): Promise<unknown> {
    const response = await getApi(app, `${ORDERS_ROUTES.BASE}/${orderId}`)
      .set(COOKIE_HEADER, cookies)
      .expect(HttpStatus.NOT_FOUND);

    return response.body;
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    orderId = await placeConfirmedOrder(app, db, clientCookies);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should answer another client as GET /orders/:id does', async () => {
    const { cookies } = await registerUser(app, SECOND_CLIENT);

    const response = await getChatHistory(app, cookies, orderId).expect(HttpStatus.NOT_FOUND);

    expect(response.body).toEqual(await foreignOrderAnswer(cookies));
  });

  it('should answer a courier not assigned to the order with the same 404', async () => {
    await assignCourier(app, db, orderId);
    const other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);

    const response = await getChatHistory(app, other.cookies, orderId).expect(HttpStatus.NOT_FOUND);
    const { cookies } = await registerUser(app, SECOND_CLIENT);

    expect(response.body).toEqual(await foreignOrderAnswer(cookies));
  });

  it('should answer a missing order with the same 404', async () => {
    const missing = await getChatHistory(app, clientCookies, MISSING_ORDER_ID).expect(
      HttpStatus.NOT_FOUND,
    );
    const { cookies } = await registerUser(app, SECOND_CLIENT);

    expect(missing.body).toEqual(await foreignOrderAnswer(cookies));
  });

  it.each([
    ['a page over the limit', { limit: CHAT_PAGE_SIZE_MAX + 1 }],
    ['a page of zero', { limit: 0 }],
    ['a beforeId that is not a number', { beforeId: 'abc' }],
    ['a beforeId of zero', { beforeId: 0 }],
    ['an unknown field', { after: 1 }],
  ])('should refuse %s with 400 before any query', async (_, query) => {
    const list = jest.spyOn(app.get(ChatHistoryService), 'list');

    await getChatHistory(app, clientCookies, orderId, query).expect(HttpStatus.BAD_REQUEST);
    expect(list).not.toHaveBeenCalled();
  });

  it('should refuse a manager with 403', async () => {
    const cookies = await createUserWithRole(app, db, MANAGER_ACCOUNT, ROLE.MANAGER);

    await getChatHistory(app, cookies, orderId).expect(HttpStatus.FORBIDDEN);
  });
});
