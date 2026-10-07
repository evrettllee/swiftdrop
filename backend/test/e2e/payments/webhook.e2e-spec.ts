import { ServiceUnavailableException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../../../src/common/enums/payment-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders, orderStatusHistory } from '../../../src/db/schema';
import { OsrmService } from '../../../src/integrations/osrm/osrm.service';
import { PaymentGateway } from '../../../src/payments/gateway/payment.gateway';
import { PAYMENT_EVENT } from '../../../src/payments/payments.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { resetTestData, seedServiceArea } from '../../support/database';
import { ROUTE } from '../../support/fixtures';
import { placeOrders, readOrderStatus } from '../../support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  postWebhook,
  readPaymentStatus,
  resetGatewayMock,
  WEBHOOK_SIGNATURE,
} from '../../support/payments';

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
    paymentRef: 'pi_test_1',
  });

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
    expect(response.status).toBe(200);
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
    expect(second.status).toBe(200);
    expect(history.filter((row) => row.status === ORDER_STATUS.CONFIRMED)).toHaveLength(1);
    expect(gateway.refund).not.toHaveBeenCalled();
  });

  it('should refund the payment and keep the order cancelled when the order was cancelled before the payment', async () => {
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.CANCELLED })
      .where(eq(orders.orderId, orderId));
    gateway.parseWebhook.mockReturnValue(paidEvent());

    const response = await postWebhook(app, WEBHOOK_SIGNATURE);

    expect(response.status).toBe(200);
    expect(gateway.refund).toHaveBeenCalledWith('pi_test_1');
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should refund on the repeated delivery when the first refund failed', async () => {
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.CANCELLED })
      .where(eq(orders.orderId, orderId));
    gateway.parseWebhook.mockReturnValue(paidEvent());
    gateway.refund.mockRejectedValueOnce(new ServiceUnavailableException());

    const first = await postWebhook(app, WEBHOOK_SIGNATURE);
    const afterFirst = await readPaymentStatus(db, paymentId);
    const second = await postWebhook(app, WEBHOOK_SIGNATURE);

    expect(first.status).toBe(503);
    expect(afterFirst).toBe(PAYMENT_STATUS.PAID);
    expect(second.status).toBe(200);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
  });

  it('should mark the payment failed and keep the order pending when the session expired', async () => {
    gateway.parseWebhook.mockReturnValue({
      type: PAYMENT_EVENT.EXPIRED,
      orderId,
      sessionId: CHECKOUT_SESSION.sessionId,
    });

    const response = await postWebhook(app, WEBHOOK_SIGNATURE);

    expect(response.status).toBe(200);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.FAILED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.PENDING);
  });
});
