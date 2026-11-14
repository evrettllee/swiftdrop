import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { and, asc, eq } from 'drizzle-orm';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, orderStatusHistory } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import {
  COURIER_OFFERS_ROUTES,
  OFFER_ID_ROUTE_PARAM,
} from '@/modules/assignment/constants/assignment.constants';
import { PAYMENT_EVENT } from '@/modules/payments/constants/payments.constants';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { createTestApp } from '@test/support/app';
import { addCourierSession, insertOffer } from '@test/support/assignment';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postApi } from '@test/support/http';
import { createManager } from '@test/support/manager';
import { postAssign, postReassign, postRestartAssignment } from '@test/support/manager-assignment';
import { placeOrders, setOrderStatus } from '@test/support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  PAYMENT_REF,
  postWebhook,
  resetGatewayMock,
  WEBHOOK_SIGNATURE,
} from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

describe('Order facts for analytics (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let manager: string;
  let courier: { courierProfileId: number; cookies: string };
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    resetGatewayMock(gateway);
    [orderId] = await placeOrders(app, (await registerUser(app)).cookies, 1);
    manager = await createManager(app, db);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
  });

  afterAll(async () => {
    await app.close();
  });

  async function readOrder() {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));

    return order;
  }

  async function firstHistoryAt(status: OrderStatus): Promise<Date> {
    const [row] = await db
      .select({ changedAt: orderStatusHistory.changedAt })
      .from(orderStatusHistory)
      .where(and(eq(orderStatusHistory.orderId, orderId), eq(orderStatusHistory.status, status)))
      .orderBy(asc(orderStatusHistory.changedAt))
      .limit(1);

    return row.changedAt;
  }

  it('should take the payment time from the webhook and keep it when a manager restarts the search', async () => {
    await insertPayment(db, orderId, { checkoutSessionId: CHECKOUT_SESSION.sessionId });
    gateway.parseWebhook.mockReturnValue({
      type: PAYMENT_EVENT.PAID,
      orderId,
      sessionId: CHECKOUT_SESSION.sessionId,
      paymentRef: PAYMENT_REF,
    });

    await postWebhook(app, WEBHOOK_SIGNATURE).expect(HttpStatus.OK);
    const paidAt = (await readOrder()).paidAt;
    await setOrderStatus(db, orderId, ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT);
    await postRestartAssignment(app, manager, orderId, { expectedCourierId: null }).expect(
      HttpStatus.OK,
    );

    expect(paidAt).toEqual(await firstHistoryAt(ORDER_STATUS.CONFIRMED));
    expect(await readOrder()).toMatchObject({ status: ORDER_STATUS.CONFIRMED, paidAt });
  });

  it('should mark an accepted offer as an automatic first assignment', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    const offerId = await insertOffer(db, orderId, courier.courierProfileId);
    const path = COURIER_OFFERS_ROUTES.ACCEPT.replace(OFFER_ID_ROUTE_PARAM, String(offerId));

    await postApi(app, `${COURIER_OFFERS_ROUTES.BASE}/${path}`)
      .set(COOKIE_HEADER, courier.cookies)
      .expect(HttpStatus.OK);

    expect(await readOrder()).toMatchObject({
      firstAssignedAt: await firstHistoryAt(ORDER_STATUS.COURIER_ASSIGNED),
      firstAssignedAuto: true,
    });
  });

  it('should mark a manual first assignment and keep it on a reassignment', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    const other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);

    await postAssign(app, manager, orderId, courier.courierProfileId).expect(HttpStatus.OK);
    const assigned = await readOrder();
    await postReassign(app, manager, orderId, {
      courierId: other.courierProfileId,
      expectedCourierId: courier.courierProfileId,
    }).expect(HttpStatus.OK);

    expect(assigned).toMatchObject({
      firstAssignedAt: await firstHistoryAt(ORDER_STATUS.COURIER_ASSIGNED),
      firstAssignedAuto: false,
    });
    expect(await readOrder()).toMatchObject({
      courierId: other.courierProfileId,
      firstAssignedAt: assigned.firstAssignedAt,
      firstAssignedAuto: false,
    });
  });

  it('should refuse a first assignment time without its kind and the other way round', async () => {
    await expect(
      db.update(orders).set({ firstAssignedAt: new Date() }).where(eq(orders.orderId, orderId)),
    ).rejects.toThrow();
    await expect(
      db.update(orders).set({ firstAssignedAuto: true }).where(eq(orders.orderId, orderId)),
    ).rejects.toThrow();
  });
});
