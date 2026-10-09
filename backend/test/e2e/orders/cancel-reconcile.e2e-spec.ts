import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../../../src/common/enums/payment-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/osrm.service';
import { PaymentGateway } from '../../../src/payments/gateway/payment.gateway';
import {
  CHECKOUT_SESSION_STATUS,
  PAYMENT_EVENT,
  SESSION_EXPIRE_RESULT,
} from '../../../src/payments/payments.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { resetTestData, seedServiceArea } from '../../support/database';
import { ROUTE } from '../../support/fixtures';
import { cancelOrder, type Cookies, placeOrders, readOrderStatus } from '../../support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  postWebhook,
  readPaymentStatus,
  resetGatewayMock,
  WEBHOOK_SIGNATURE,
} from '../../support/payments';

const PAYMENT_REF = 'pi_test_reconciled';

describe('Order cancellation with a session that is no longer open (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: Cookies;
  let orderId: number;
  let paymentId: number;
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
    await resetTestData(db);
    await seedServiceArea(db);
    getRoute.mockReset();
    getRoute.mockResolvedValue(ROUTE);
    resetGatewayMock(gateway);

    ({ cookies } = await registerUser(app));
    [orderId] = await placeOrders(app, cookies, 1);
    paymentId = await insertPayment(db, orderId, { checkoutSessionId: CHECKOUT_SESSION.sessionId });
    // Stripe refuses to close the session: it is no longer open.
    gateway.expireCheckoutSession.mockResolvedValue(SESSION_EXPIRE_RESULT.NOT_OPEN);
  });

  afterAll(async () => {
    await app.close();
  });

  function paySession(): void {
    gateway.getCheckoutSession.mockResolvedValue({
      status: CHECKOUT_SESSION_STATUS.COMPLETE,
      isPaid: true,
      paymentRef: PAYMENT_REF,
    });
  }

  it('should mark the payment failed without an error in the log when its session has expired', async () => {
    gateway.getCheckoutSession.mockResolvedValue({
      status: CHECKOUT_SESSION_STATUS.EXPIRED,
      isPaid: false,
      paymentRef: null,
    });
    const error = jest.spyOn(Logger.prototype, 'error');

    const response = await cancelOrder(app, cookies, orderId);

    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
    expect(response.status).toBe(200);
    expect(gateway.getCheckoutSession).toHaveBeenCalledWith(CHECKOUT_SESSION.sessionId);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.FAILED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
    expect(gateway.refund).not.toHaveBeenCalled();
  });

  it('should mark the payment paid and refund it at once when its session was paid', async () => {
    paySession();

    const response = await cancelOrder(app, cookies, orderId);

    expect(response.status).toBe(200);
    expect(gateway.refund).toHaveBeenCalledTimes(1);
    expect(gateway.refund).toHaveBeenCalledWith(PAYMENT_REF);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should change nothing when the webhook of the paid session comes after the reconciliation', async () => {
    paySession();
    await cancelOrder(app, cookies, orderId).expect(200);
    gateway.parseWebhook.mockReturnValue({
      type: PAYMENT_EVENT.PAID,
      orderId,
      sessionId: CHECKOUT_SESSION.sessionId,
      paymentRef: PAYMENT_REF,
    });

    await postWebhook(app, WEBHOOK_SIGNATURE).expect(200);
    await postWebhook(app, WEBHOOK_SIGNATURE).expect(200);

    expect(gateway.refund).toHaveBeenCalledTimes(1);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });
});
