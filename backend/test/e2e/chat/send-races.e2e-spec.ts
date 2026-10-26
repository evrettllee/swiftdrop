import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Response } from 'supertest';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { CHAT_ERROR_MESSAGES } from '@/modules/chat/constants/chat.constants';
import { COURIER_ORDERS_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { createTestApp } from '@test/support/app';
import { addCourierSession } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { countOrderMessages, placeConfirmedOrder, sendChatMessage } from '@test/support/chat';
import { assignOrder, CAR, COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postApi } from '@test/support/http';
import { cancelOrder, type Cookies, readOrderStatus } from '@test/support/orders';
import { resetServiceArea } from '@test/support/pricing';

const RIGHT_CODE = '4821';
// Each round is a new order; the messages of one user stay under the limit of 20 a minute. How much
// later the message starts than the status change: below zero the change starts later. Each round
// checks only that its own outcome is consistent; which side wins is up to timing. Both orders of
// the two are covered without timing in send-locks.e2e-spec.ts.
const SEND_OFFSETS_MS = [-20, -5, 0, 2, 5, 20];

function after<T>(delayMs: number, start: () => PromiseLike<T>): Promise<T> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(delayMs, 0))).then(start);
}

// Either the message landed while the order was still open, or it was refused and is not there.
const CONSISTENT_OUTCOMES = [
  { status: HttpStatus.CREATED, saved: 1, refusal: undefined },
  { status: HttpStatus.CONFLICT, saved: 0, refusal: CHAT_ERROR_MESSAGES.CHAT_CLOSED },
];

describe('Chat messages racing the end of an order (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let clientCookies: Cookies;
  let courier: { cookies: string; courierProfileId: number };
  const getRoute = jest.fn();

  async function orderWithCourier(status: OrderStatus): Promise<number> {
    const orderId = await placeConfirmedOrder(app, db, clientCookies);
    await assignOrder(db, orderId, courier.courierProfileId, status);
    await db.update(orders).set({ otpCode: RIGHT_CODE }).where(eq(orders.orderId, orderId));

    return orderId;
  }

  function deliver(orderId: number) {
    const path = `${COURIER_ORDERS_ROUTES.BASE}/${COURIER_ORDERS_ROUTES.DELIVER.replace(ORDER_ID_ROUTE_PARAM, String(orderId))}`;

    return postApi(app, path).set(COOKIE_HEADER, courier.cookies).send({ code: RIGHT_CODE });
  }

  async function expectConsistent(sent: Response, orderId: number): Promise<void> {
    const body = sent.body as { message?: unknown };

    expect(CONSISTENT_OUTCOMES).toContainEqual({
      status: sent.status,
      saved: await countOrderMessages(db, orderId),
      refusal: sent.status === HttpStatus.CREATED ? undefined : body.message,
    });
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies: clientCookies } = await registerUser(app));
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should save a message sent with the delivery before it, or refuse it', async () => {
    for (const offsetMs of SEND_OFFSETS_MS) {
      const orderId = await orderWithCourier(ORDER_STATUS.IN_TRANSIT);

      const [sent, delivered] = await Promise.all([
        after(offsetMs, () => sendChatMessage(app, courier.cookies, orderId)),
        after(-offsetMs, () => deliver(orderId)),
      ]);

      expect(delivered.status).toBe(HttpStatus.OK);
      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.DELIVERED);
      await expectConsistent(sent, orderId);
    }
  });

  it('should save a message sent with the cancellation before it, or refuse it', async () => {
    for (const offsetMs of SEND_OFFSETS_MS) {
      const orderId = await orderWithCourier(ORDER_STATUS.COURIER_ASSIGNED);

      const [sent, cancelled] = await Promise.all([
        after(offsetMs, () => sendChatMessage(app, clientCookies, orderId)),
        after(-offsetMs, () => cancelOrder(app, clientCookies, orderId)),
      ]);

      expect(cancelled.status).toBe(HttpStatus.OK);
      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
      await expectConsistent(sent, orderId);
    }
  });
});
