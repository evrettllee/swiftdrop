import { ServiceUnavailableException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../../../src/common/enums/payment-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders, payments } from '../../../src/db/schema';
import { OsrmService } from '../../../src/integrations/osrm/osrm.service';
import { ORDERS_ROUTES } from '../../../src/orders/orders.constants';
import { PaymentGateway } from '../../../src/payments/gateway/payment.gateway';
import { createTestApp } from '../../support/app';
import { COOKIE_HEADER, registerUser } from '../../support/auth';
import { resetTestData, seedServiceArea } from '../../support/database';
import { ROUTE } from '../../support/fixtures';
import { postApi } from '../../support/http';
import { type Cookies, placeOrders } from '../../support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  resetGatewayMock,
} from '../../support/payments';

describe('Order cancellation with payments (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: Cookies;
  let orderId: number;
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  function cancelOrder() {
    return postApi(app, `${ORDERS_ROUTES.BASE}/${orderId}/cancel`).set(COOKIE_HEADER, cookies);
  }

  async function readPaymentStatus(paymentId: number): Promise<string> {
    const [payment] = await db
      .select({ status: payments.status })
      .from(payments)
      .where(eq(payments.paymentId, paymentId));

    return payment.status;
  }

  async function readOrderStatus(): Promise<string> {
    const [order] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.orderId, orderId));

    return order.status;
  }

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
    getRoute.mockReset();
    getRoute.mockResolvedValue(ROUTE);
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

    const response = await cancelOrder();

    expect(response.status).toBe(200);
    expect(gateway.expireCheckoutSession).toHaveBeenCalledWith(CHECKOUT_SESSION.sessionId);
    expect(await readPaymentStatus(paymentId)).toBe(PAYMENT_STATUS.FAILED);
    expect(await readOrderStatus()).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should refund the payment when a paid order is cancelled', async () => {
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.CONFIRMED })
      .where(eq(orders.orderId, orderId));
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: 'pi_test_1',
    });

    const response = await cancelOrder();

    expect(response.status).toBe(200);
    expect(gateway.refund).toHaveBeenCalledWith('pi_test_1');
    expect(await readPaymentStatus(paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readOrderStatus()).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should keep the order and the payment as they were when the refund fails', async () => {
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.CONFIRMED })
      .where(eq(orders.orderId, orderId));
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: 'pi_test_1',
    });
    gateway.refund.mockRejectedValue(new ServiceUnavailableException());

    const response = await cancelOrder();

    expect(response.status).toBe(503);
    expect(await readPaymentStatus(paymentId)).toBe(PAYMENT_STATUS.PAID);
    expect(await readOrderStatus()).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('should still cancel the order and leave the payment pending when the session cannot be closed', async () => {
    const paymentId = await insertPayment(db, orderId);
    gateway.expireCheckoutSession.mockRejectedValue(new ServiceUnavailableException());

    const response = await cancelOrder();

    expect(response.status).toBe(200);
    expect(await readPaymentStatus(paymentId)).toBe(PAYMENT_STATUS.PENDING);
    expect(await readOrderStatus()).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should not call the gateway when the order has no payments', async () => {
    const response = await cancelOrder();

    expect(response.status).toBe(200);
    expect(gateway.expireCheckoutSession).not.toHaveBeenCalled();
    expect(gateway.refund).not.toHaveBeenCalled();
  });
});
