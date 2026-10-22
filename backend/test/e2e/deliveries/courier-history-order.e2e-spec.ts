import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS, type OrderStatus } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import {
  COURIER_ORDERS_ROUTES,
  DELIVERIES_ERROR_MESSAGES,
} from '../../../src/modules/deliveries/constants/deliveries.constants';
import { addCourierOnShift, addCourierSession } from '../../support/assignment';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '../../support/couriers';
import { ROUTE, SMALL_PACKAGE, VALID_ORDER } from '../../support/fixtures';
import { COURIER_STAGES, finishOrder, historyOrderPath } from '../../support/history-orders';
import { getApi } from '../../support/http';
import { type Cookies, placeOrders } from '../../support/orders';
import {
  COURIER_POINT,
  createRoutingMocks,
  createRoutingTestApp,
  resetRouting,
} from '../../support/routing';

const MISSING_ORDER_ID = 999_999_999;

describe('Finished order of the courier (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let courierCookies: string;
  let courierId: number;
  let orderId: number;
  const mocks = createRoutingMocks();

  function get(path: string, cookies: Cookies = courierCookies) {
    return getApi(app, path).set(COOKIE_HEADER, cookies);
  }

  function finish(id: number, courier: number, status: OrderStatus): Promise<void> {
    return finishOrder(db, id, courier, status);
  }

  beforeAll(async () => {
    app = await createRoutingTestApp(mocks);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetRouting(app, db, mocks);
    ({ cookies: clientCookies } = await registerUser(app));
    [orderId] = await placeOrders(app, clientCookies, 1);
    ({ courierProfileId: courierId, cookies: courierCookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      COURIER_POINT,
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return the delivered order with the stages of the courier only', async () => {
    await finish(orderId, courierId, ORDER_STATUS.DELIVERED);

    const response = await get(historyOrderPath(orderId)).expect(HttpStatus.OK);

    expect(response.body).toEqual({
      orderId,
      status: ORDER_STATUS.DELIVERED,
      finishedAt: expect.any(String),
      pickup: { ...VALID_ORDER.pickup, apartment: null },
      delivery: VALID_ORDER.delivery,
      parcel: SMALL_PACKAGE,
      distanceKm: ROUTE.distanceKm,
      history: [...COURIER_STAGES, ORDER_STATUS.DELIVERED].map((status) => ({
        status,
        changedAt: expect.any(String),
      })),
    });
  });

  it('should tell nobody of the people of the order', async () => {
    await finish(orderId, courierId, ORDER_STATUS.DELIVERED);

    const response = await get(historyOrderPath(orderId)).expect(HttpStatus.OK);
    const body = JSON.stringify(response.body);

    expect(body).not.toContain(VALID_ORDER.recipient.name);
    expect(body).not.toContain('291234567');
    expect(body).not.toMatch(/sender|recipient|phone|price/i);
  });

  it('should end the stages with the cancellation of a cancelled order', async () => {
    await finish(orderId, courierId, ORDER_STATUS.CANCELLED);

    const response = await get(historyOrderPath(orderId)).expect(HttpStatus.OK);

    expect(response.body.status).toBe(ORDER_STATUS.CANCELLED);
    expect(response.body.history.at(-1).status).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should answer the same not found for a foreign, a missing and an active order', async () => {
    const [foreignId, activeId] = await placeOrders(app, clientCookies, 2);
    const otherId = await addCourierOnShift(app, db, SECOND_COURIER_ACCOUNT, CAR, COURIER_POINT);
    await finish(foreignId, otherId, ORDER_STATUS.DELIVERED);
    await assignOrder(db, activeId, courierId, ORDER_STATUS.IN_TRANSIT);

    const answers = await Promise.all(
      [foreignId, MISSING_ORDER_ID, activeId].map((id) =>
        get(historyOrderPath(id)).expect(HttpStatus.NOT_FOUND),
      ),
    );

    for (const answer of answers) {
      expect(answer.body.message).toBe(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }
  });

  it('should keep the current order and the history on their own routes', async () => {
    await get(`${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.CURRENT}`).expect(
      HttpStatus.OK,
    );
    await get(`${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.HISTORY}`).expect(
      HttpStatus.OK,
    );
    await get(historyOrderPath('abc')).expect(HttpStatus.BAD_REQUEST);
  });

  it('should refuse the order when the user is a client', async () => {
    await get(historyOrderPath(orderId), clientCookies).expect(HttpStatus.FORBIDDEN);
  });
});
