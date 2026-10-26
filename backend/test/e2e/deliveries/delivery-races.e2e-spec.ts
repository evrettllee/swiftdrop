import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DB_LOCK_TIMEOUT_MS, DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_ORDERS_ROUTES,
  DELIVERIES_ERROR_MESSAGES,
} from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { createTestApp } from '@test/support/app';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { LOCK_TEST_MARGIN_MS } from '@test/support/constants';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postApi } from '@test/support/http';
import { holdOrder, whileRowsAreHeld } from '@test/support/locks';
import { placeOrders, readOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

type DeliveryAction = typeof COURIER_ORDERS_ROUTES.PICKUP | typeof COURIER_ORDERS_ROUTES.DELIVER;

const RIGHT_CODE = '4821';
const WRONG_CODE = '1111';
const TWO_ATTEMPTS = 2;

describe('Delivery steps under concurrent changes (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let courierId: number;
  let cookies: string;
  const getRoute = jest.fn();

  function act(action: DeliveryAction, body: Record<string, unknown> = {}) {
    const path = `${COURIER_ORDERS_ROUTES.BASE}/${action.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return postApi(app, path).set(COOKIE_HEADER, cookies).send(body);
  }

  async function readAttempts(): Promise<number> {
    const [order] = await db
      .select({ attempts: orders.otpFailedAttempts })
      .from(orders)
      .where(eq(orders.orderId, orderId));

    return order.attempts;
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const client = await registerUser(app);
    [orderId] = await placeOrders(app, client.cookies, 1);
    ({ courierProfileId: courierId, cookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should count both wrong codes when two are entered at once', async () => {
    await assignOrder(db, orderId, courierId, ORDER_STATUS.IN_TRANSIT);
    await db.update(orders).set({ otpCode: RIGHT_CODE }).where(eq(orders.orderId, orderId));

    const responses = await Promise.all([
      act(COURIER_ORDERS_ROUTES.DELIVER, { code: WRONG_CODE }),
      act(COURIER_ORDERS_ROUTES.DELIVER, { code: WRONG_CODE }),
    ]);

    expect(responses.map((response) => response.status)).toEqual([
      HttpStatus.UNPROCESSABLE_ENTITY,
      HttpStatus.UNPROCESSABLE_ENTITY,
    ]);
    expect(await readAttempts()).toBe(TWO_ATTEMPTS);
  });

  it(
    'should answer 409 and keep the order when the pickup meets a cancellation in progress',
    async () => {
      await assignOrder(db, orderId, courierId, ORDER_STATUS.COURIER_ASSIGNED);

      const response = await whileRowsAreHeld(db, holdOrder(orderId), () =>
        act(COURIER_ORDERS_ROUTES.PICKUP),
      );

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.message).toBe(DELIVERIES_ERROR_MESSAGES.BUSY);
      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.COURIER_ASSIGNED);
    },
    DB_LOCK_TIMEOUT_MS + LOCK_TEST_MARGIN_MS,
  );

  it(
    'should answer 409 and spend no attempt when the code meets another operation on the order',
    async () => {
      await assignOrder(db, orderId, courierId, ORDER_STATUS.IN_TRANSIT);
      await db.update(orders).set({ otpCode: RIGHT_CODE }).where(eq(orders.orderId, orderId));

      const response = await whileRowsAreHeld(db, holdOrder(orderId), () =>
        act(COURIER_ORDERS_ROUTES.DELIVER, { code: WRONG_CODE }),
      );

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.message).toBe(DELIVERIES_ERROR_MESSAGES.BUSY);
      expect(await readAttempts()).toBe(0);
    },
    DB_LOCK_TIMEOUT_MS + LOCK_TEST_MARGIN_MS,
  );
});
