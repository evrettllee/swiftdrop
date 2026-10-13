import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orderStatusHistory } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import {
  ORDERS_ERROR_MESSAGES,
  ORDERS_ROUTES,
  ORDERS_VALIDATION_MESSAGES,
} from '../../../src/modules/orders/constants/orders.constants';
import { createTestApp } from '../../support/app';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { resetTestData, seedServiceArea } from '../../support/database';
import { MINSK_DELIVERY, MINSK_PICKUP, ROUTE, SMALL_PACKAGE } from '../../support/fixtures';
import { getApi } from '../../support/http';
import { type Cookies, placeOrders, SECOND_CLIENT } from '../../support/orders';

const MISSING_ORDER_ID = 999_999;

describe('Order details (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
    getRoute.mockReset();
    getRoute.mockResolvedValue(ROUTE);
  });

  afterAll(async () => {
    await app.close();
  });

  function getOrder(cookies: Cookies, orderId: number | string) {
    return getApi(app, `${ORDERS_ROUTES.BASE}/${orderId}`).set(COOKIE_HEADER, cookies);
  }

  it('should return the order with addresses, recipient, package and history when the client owns it', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);

    const response = await getOrder(cookies, orderId).expect(200);

    expect(response.body).toEqual({
      orderId,
      status: ORDER_STATUS.PENDING,
      price: 9.23,
      currency: 'BYN',
      priceCoefficient: 1,
      distanceKm: 7.98,
      estimatedDeliveryAt: expect.any(String),
      createdAt: expect.any(String),
      recipient: { name: 'Ирина Козлова', phone: '+375291234567' },
      parcel: {
        weightKg: SMALL_PACKAGE.weightKg,
        lengthCm: SMALL_PACKAGE.lengthCm,
        widthCm: SMALL_PACKAGE.widthCm,
        heightCm: SMALL_PACKAGE.heightCm,
        isFragile: false,
      },
      pickup: {
        city: 'Минск',
        street: 'ул. Свердлова',
        house: '13а',
        apartment: null,
        ...MINSK_PICKUP,
      },
      delivery: {
        city: 'Минск',
        street: 'пр-т Притыцкого',
        house: '83',
        apartment: '47',
        ...MINSK_DELIVERY,
      },
      history: [{ status: ORDER_STATUS.PENDING, changedAt: expect.any(String) }],
      payment: null,
    });
  });

  it('should return the history from the oldest record to the newest when the order changed status', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);
    await db.insert(orderStatusHistory).values({ orderId, status: ORDER_STATUS.CONFIRMED });

    const response = await getOrder(cookies, orderId).expect(200);

    expect(response.body.history.map((entry: { status: string }) => entry.status)).toEqual([
      ORDER_STATUS.PENDING,
      ORDER_STATUS.CONFIRMED,
    ]);
  });

  it('should return 404 when the order belongs to another client', async () => {
    const { cookies } = await registerUser(app);
    const { cookies: otherCookies } = await registerUser(app, SECOND_CLIENT);
    const [orderId] = await placeOrders(app, cookies, 1);

    const response = await getOrder(otherCookies, orderId).expect(404);

    expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.NOT_FOUND);
  });

  it('should return 404 when the order does not exist', async () => {
    const { cookies } = await registerUser(app);

    const response = await getOrder(cookies, MISSING_ORDER_ID).expect(404);

    expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.NOT_FOUND);
  });

  it('should return 400 with a field error when the order id is not a number', async () => {
    const { cookies } = await registerUser(app);

    const response = await getOrder(cookies, 'abc').expect(400);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'orderId',
          message: ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID,
        }),
      ]),
    );
  });

  it('should return 401 when the request has no authentication', async () => {
    await getApi(app, `${ORDERS_ROUTES.BASE}/1`).expect(401);
  });
});
