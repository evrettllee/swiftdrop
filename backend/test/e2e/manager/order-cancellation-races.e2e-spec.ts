import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { COURIER_ORDERS_ROUTES } from '@/modules/deliveries/constants/deliveries.constants';
import { ORDER_ID_ROUTE_PARAM } from '@/modules/orders/constants/orders.constants';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { addCourierSession } from '@test/support/assignment';
import { createTestApp } from '@test/support/app';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { assignOrder, CAR, COURIER_ACCOUNT, SECOND_COURIER_ACCOUNT } from '@test/support/couriers';
import { MINSK_PICKUP } from '@test/support/fixtures';
import { postApi, sortedStatuses } from '@test/support/http';
import { createManager } from '@test/support/manager';
import { postManagerCancel, postReassign } from '@test/support/manager-assignment';
import { cancelOrder, type Cookies, placeOrders, readOrderStatus } from '@test/support/orders';
import {
  createGatewayMock,
  insertPayment,
  PAYMENT_REF,
  readPaymentStatus,
  resetGatewayMock,
} from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

const CONFLICT_PAIR = [HttpStatus.OK, HttpStatus.CONFLICT];
const BODY = { reason: 'Клиент попросил отменить по телефону' };

describe('Cancellation by a manager under concurrent changes (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let client: Cookies;
  let manager: string;
  let orderId: number;
  let paymentId: number;
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
    ({ cookies: client } = await registerUser(app));
    [orderId] = await placeOrders(app, client, 1);
    courier = await addCourierSession(app, db, COURIER_ACCOUNT, CAR, MINSK_PICKUP);
    await assignOrder(db, orderId, courier.courierProfileId, ORDER_STATUS.COURIER_ASSIGNED);
    paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: PAYMENT_REF,
    });
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should let either the cancellation or the pickup win, and refund only after a cancellation', async () => {
    const path = COURIER_ORDERS_ROUTES.PICKUP.replace(ORDER_ID_ROUTE_PARAM, String(orderId));

    const [cancel, pickup] = await Promise.all([
      postManagerCancel(app, manager, orderId, BODY),
      postApi(app, `${COURIER_ORDERS_ROUTES.BASE}/${path}`).set(COOKIE_HEADER, courier.cookies),
    ]);

    expect(sortedStatuses([cancel, pickup])).toEqual(CONFLICT_PAIR);

    if (cancel.status === HttpStatus.OK) {
      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
      expect(gateway.refund).toHaveBeenCalledTimes(1);
    } else {
      expect(cancel.body).toMatchObject({ code: 'ORDER_NOT_CANCELLABLE' });
      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.PICKED_UP);
      expect(gateway.refund).not.toHaveBeenCalled();
      expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PAID);
    }
  });

  it('should let one of the manager and the client cancel and refund exactly once', async () => {
    const responses = await Promise.all([
      postManagerCancel(app, manager, orderId, BODY),
      cancelOrder(app, client, orderId),
    ]);

    expect(sortedStatuses(responses)).toEqual(CONFLICT_PAIR);
    expect(gateway.refund).toHaveBeenCalledTimes(1);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should serialise a cancellation and a reassignment and end with the order cancelled', async () => {
    const other = await addCourierSession(app, db, SECOND_COURIER_ACCOUNT, CAR, MINSK_PICKUP);

    const [cancel, reassign] = await Promise.all([
      postManagerCancel(app, manager, orderId, BODY),
      postReassign(app, manager, orderId, {
        courierId: other.courierProfileId,
        expectedCourierId: courier.courierProfileId,
      }),
    ]);

    expect(cancel.status).toBe(HttpStatus.OK);
    expect([HttpStatus.OK, HttpStatus.CONFLICT]).toContain(reassign.status);

    if (reassign.status === HttpStatus.CONFLICT) {
      expect(reassign.body).toMatchObject({ code: 'ORDER_NOT_REASSIGNABLE' });
    }

    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
    expect(gateway.refund).toHaveBeenCalledTimes(1);
  });
});
