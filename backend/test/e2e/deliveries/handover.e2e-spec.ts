import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_ORDERS_ROUTES,
  DELIVERIES_ERROR_MESSAGES,
  DELIVERY_CODE_MAX_ATTEMPTS,
} from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { createTestApp } from '@test/support/app';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postApi } from '@test/support/http';
import { placeOrders, readOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const RIGHT_CODE = '4821';
const WRONG_CODE = '1111';
const PAST_MS = 1000;

describe('Delivery handover (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let cookies: string;
  const getRoute = jest.fn();

  function deliver(code: string) {
    const path = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.DELIVER.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return postApi(app, path).set(COOKIE_HEADER, cookies).send({ code });
  }

  async function readCodeState() {
    const [order] = await db
      .select({ attempts: orders.otpFailedAttempts, lockedUntil: orders.otpLockedUntil })
      .from(orders)
      .where(eq(orders.orderId, orderId));

    return order;
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    const client = await registerUser(app);
    [orderId] = await placeOrders(app, client.cookies, 1);
    let courierId: number;
    ({ courierProfileId: courierId, cookies } = await addCourierSession(
      app,
      db,
      COURIER_ACCOUNT,
      CAR,
      MINSK_PICKUP,
    ));
    await assignOrder(db, orderId, courierId, ORDER_STATUS.IN_TRANSIT);
    await db.update(orders).set({ otpCode: RIGHT_CODE }).where(eq(orders.orderId, orderId));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should deliver the order when the code is right', async () => {
    const response = await deliver(RIGHT_CODE).expect(HttpStatus.OK);

    expect(response.body.status).toBe(ORDER_STATUS.DELIVERED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.DELIVERED);
  });

  it('should count the attempt and tell how many are left when the code is wrong', async () => {
    const response = await deliver(WRONG_CODE).expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body.message).toBe(
      DELIVERIES_ERROR_MESSAGES.WRONG_CODE(DELIVERY_CODE_MAX_ATTEMPTS - 1),
    );
    expect((await readCodeState()).attempts).toBe(1);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.IN_TRANSIT);
  });

  it('should lock the entering after the last wrong attempt, even for the right code', async () => {
    for (let attempt = 1; attempt < DELIVERY_CODE_MAX_ATTEMPTS; attempt += 1) {
      await deliver(WRONG_CODE).expect(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    await deliver(WRONG_CODE).expect(HttpStatus.TOO_MANY_REQUESTS);
    await deliver(RIGHT_CODE).expect(HttpStatus.TOO_MANY_REQUESTS);

    expect((await readCodeState()).lockedUntil).not.toBeNull();
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.IN_TRANSIT);
  });

  it('should accept the right code again when the lock is over', async () => {
    await db
      .update(orders)
      .set({ otpLockedUntil: new Date(Date.now() - PAST_MS) })
      .where(eq(orders.orderId, orderId));

    await deliver(RIGHT_CODE).expect(HttpStatus.OK);
  });

  it('should refuse the code before the courier sets off to the recipient', async () => {
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.PICKED_UP })
      .where(eq(orders.orderId, orderId));

    await deliver(RIGHT_CODE).expect(HttpStatus.CONFLICT);
  });

  it('should refuse the request when the code is not four digits', async () => {
    await deliver('48a1').expect(HttpStatus.BAD_REQUEST);

    expect((await readCodeState()).attempts).toBe(0);
  });
});
