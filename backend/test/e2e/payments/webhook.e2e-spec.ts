import { ServiceUnavailableException, HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, orderStatusHistory } from '@/database/schema';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { PAYMENT_EVENT } from '@/modules/payments/constants/payments.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { placeOrders, readOrderStatus } from '@test/support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  postWebhook,
  readPaymentStatus,
  resetGatewayMock,
  WEBHOOK_SIGNATURE,
  PAYMENT_REF,
} from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';
import { statusChange } from '@test/support/order-status';

describe('Payment webhook (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let paymentId: number;
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  const paidEvent = () => ({
    type: PAYMENT_EVENT.PAID,
    orderId,
    sessionId: CHECKOUT_SESSION.sessionId,
    paymentRef: PAYMENT_REF,
  });

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

    const { cookies } = await registerUser(app);
    [orderId] = await placeOrders(app, cookies, 1);
    paymentId = await insertPayment(db, orderId, { checkoutSessionId: CHECKOUT_SESSION.sessionId });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should mark the payment paid and confirm the order when the payment event arrives', async () => {
    gateway.parseWebhook.mockReturnValue(paidEvent());

    const response = await postWebhook(app, WEBHOOK_SIGNATURE);

    const history = await db
      .select({ status: orderStatusHistory.status, changedBy: orderStatusHistory.changedBy })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId));
    expect(response.status).toBe(HttpStatus.OK);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PAID);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
    expect(history).toContainEqual({ status: ORDER_STATUS.CONFIRMED, changedBy: null });
  });

  it('should change nothing the second time when the same event is delivered twice', async () => {
    gateway.parseWebhook.mockReturnValue(paidEvent());

    await postWebhook(app, WEBHOOK_SIGNATURE);
    const second = await postWebhook(app, WEBHOOK_SIGNATURE);

    const history = await db
      .select({ status: orderStatusHistory.status })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId));
    expect(second.status).toBe(HttpStatus.OK);
    expect(history.filter((row) => row.status === ORDER_STATUS.CONFIRMED)).toHaveLength(1);
    expect(gateway.refund).not.toHaveBeenCalled();
  });

  it('should refund the payment and keep the order cancelled when the order was cancelled before the payment', async () => {
    await db
      .update(orders)
      .set(statusChange(ORDER_STATUS.CANCELLED))
      .where(eq(orders.orderId, orderId));
    gateway.parseWebhook.mockReturnValue(paidEvent());

    const response = await postWebhook(app, WEBHOOK_SIGNATURE);

    expect(response.status).toBe(HttpStatus.OK);
    expect(gateway.refund).toHaveBeenCalledWith(PAYMENT_REF);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should refund on the repeated delivery when the first refund failed', async () => {
    await db
      .update(orders)
      .set(statusChange(ORDER_STATUS.CANCELLED))
      .where(eq(orders.orderId, orderId));
    gateway.parseWebhook.mockReturnValue(paidEvent());
    gateway.refund.mockRejectedValueOnce(new ServiceUnavailableException());

    const first = await postWebhook(app, WEBHOOK_SIGNATURE);
    const afterFirst = await readPaymentStatus(db, paymentId);
    const second = await postWebhook(app, WEBHOOK_SIGNATURE);

    expect(first.status).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(afterFirst).toBe(PAYMENT_STATUS.PAID);
    expect(second.status).toBe(HttpStatus.OK);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
  });

  it('should mark the payment failed and keep the order pending when the session expired', async () => {
    gateway.parseWebhook.mockReturnValue({
      type: PAYMENT_EVENT.EXPIRED,
      orderId,
      sessionId: CHECKOUT_SESSION.sessionId,
    });

    const response = await postWebhook(app, WEBHOOK_SIGNATURE);

    expect(response.status).toBe(HttpStatus.OK);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.FAILED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.PENDING);
  });
});
