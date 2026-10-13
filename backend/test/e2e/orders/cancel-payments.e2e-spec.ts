import { ServiceUnavailableException, HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../../../src/common/enums/payment-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '../../../src/modules/payments/contracts/payment-gateway.contract';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { type Cookies, placeOrders, readOrderStatus, cancelOrder } from '../../support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  readPaymentStatus,
  resetGatewayMock,
  PAYMENT_REF,
} from '../../support/payments';
import { resetServiceArea } from '../../support/pricing';

describe('Order cancellation with payments (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: Cookies;
  let orderId: number;
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

    ({ cookies } = await registerUser(app));
    [orderId] = await placeOrders(app, cookies, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should close the payment session and mark the payment failed when an unpaid order is cancelled', async () => {
    const paymentId = await insertPayment(db, orderId, {
      checkoutSessionId: CHECKOUT_SESSION.sessionId,
    });

    const response = await cancelOrder(app, cookies, orderId);

    expect(response.status).toBe(HttpStatus.OK);
    expect(gateway.expireCheckoutSession).toHaveBeenCalledWith(CHECKOUT_SESSION.sessionId);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.FAILED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should refund the payment when a paid order is cancelled', async () => {
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.CONFIRMED })
      .where(eq(orders.orderId, orderId));
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: PAYMENT_REF,
    });

    const response = await cancelOrder(app, cookies, orderId);

    expect(response.status).toBe(HttpStatus.OK);
    expect(gateway.refund).toHaveBeenCalledWith(PAYMENT_REF);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should keep the order and the payment as they were when the refund fails', async () => {
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.CONFIRMED })
      .where(eq(orders.orderId, orderId));
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: PAYMENT_REF,
    });
    gateway.refund.mockRejectedValue(new ServiceUnavailableException());

    const response = await cancelOrder(app, cookies, orderId);

    expect(response.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PAID);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('should still cancel the order and leave the payment pending when the session cannot be closed', async () => {
    const paymentId = await insertPayment(db, orderId);
    gateway.expireCheckoutSession.mockRejectedValue(new ServiceUnavailableException());

    const response = await cancelOrder(app, cookies, orderId);

    expect(response.status).toBe(HttpStatus.OK);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PENDING);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should not call the gateway when the order has no payments', async () => {
    const response = await cancelOrder(app, cookies, orderId);

    expect(response.status).toBe(HttpStatus.OK);
    expect(gateway.expireCheckoutSession).not.toHaveBeenCalled();
    expect(gateway.refund).not.toHaveBeenCalled();
  });
});
