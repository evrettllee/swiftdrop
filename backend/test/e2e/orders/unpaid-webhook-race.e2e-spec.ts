import { setTimeout as delay } from 'node:timers/promises';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { Response } from 'supertest';
import { MS_PER_MINUTE } from '../../../src/common/constants/time.constants';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../../../src/common/enums/payment-status.enum';
import { DB_LOCK_TIMEOUT_MS, DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders } from '../../../src/database/schema';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { UNPAID_ORDER_TTL_MS } from '../../../src/modules/orders/constants/orders.constants';
import { UnpaidOrdersService } from '../../../src/modules/orders/services/unpaid-orders.service';
import { PaymentGateway } from '../../../src/modules/payments/contracts/payment-gateway.contract';
import { PAYMENT_EVENT } from '../../../src/modules/payments/constants/payments.constants';
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

const PAYMENT_REF = 'pi_test_race';
// Time for the webhook to mark the payment paid and reach the lock of the order row, which the
// cancelling transaction holds.
const LOCK_WAIT_MS = 300;
// The test waits for the lock timeout itself, so it gets this much more than the timeout.
const LOCK_TEST_MARGIN_MS = 10_000;

describe('Unpaid order cancelled while its payment arrives (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let unpaidOrders: UnpaidOrdersService;
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
    unpaidOrders = app.get(UnpaidOrdersService);
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

    // The order is past the time to pay.
    const createdAt = new Date(Date.now() - UNPAID_ORDER_TTL_MS - MS_PER_MINUTE);
    await db.update(orders).set({ createdAt }).where(eq(orders.orderId, orderId));

    gateway.parseWebhook.mockReturnValue({
      type: PAYMENT_EVENT.PAID,
      orderId,
      sessionId: CHECKOUT_SESSION.sessionId,
      paymentRef: PAYMENT_REF,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should leave the order cancelled with the money returned when the payment arrives during the cancellation', async () => {
    let webhook: Promise<Response> | undefined;

    // The cancellation closes the session inside its transaction. Right then the client pays: the
    // webhook starts, and Stripe refuses to close a session that is already paid.
    gateway.expireCheckoutSession.mockImplementation(async () => {
      webhook = postWebhook(app, WEBHOOK_SIGNATURE).then((response) => response);
      await delay(LOCK_WAIT_MS);
      throw new ServiceUnavailableException();
    });

    const cancelledCount = await unpaidOrders.cancelExpired();
    const webhookResponse = await webhook;

    expect(cancelledCount).toBe(1);
    expect(webhookResponse?.status).toBe(200);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
    expect(gateway.refund).toHaveBeenCalledTimes(1);
    expect(gateway.refund).toHaveBeenCalledWith(PAYMENT_REF);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
  });

  it('should leave the order confirmed and the payment kept when the payment arrives before the cancellation', async () => {
    await postWebhook(app, WEBHOOK_SIGNATURE).expect(200);

    const cancelledCount = await unpaidOrders.cancelExpired();

    expect(cancelledCount).toBe(0);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PAID);
    expect(gateway.refund).not.toHaveBeenCalled();
  });

  it(
    'should leave the order for the next run when its row stays locked longer than the lock timeout',
    async () => {
      const lockTaken = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      // Another transaction holds the order row, for example one stuck on a slow call.
      const holder = db.transaction(async (tx) => {
        await tx.select().from(orders).where(eq(orders.orderId, orderId)).for('update');
        lockTaken.resolve();
        await release.promise;
      });
      await lockTaken.promise;
      const warn = jest.spyOn(Logger.prototype, 'warn');
      const error = jest.spyOn(Logger.prototype, 'error');

      const blockedCount = await unpaidOrders.cancelExpired();
      release.resolve();
      await holder;
      const nextCount = await unpaidOrders.cancelExpired();

      // A busy order is no failure: a warning, not an error.
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(`Order ${orderId} is busy`));
      expect(error).not.toHaveBeenCalled();
      warn.mockRestore();
      error.mockRestore();
      expect(blockedCount).toBe(0);
      expect(nextCount).toBe(1);
      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
    },
    DB_LOCK_TIMEOUT_MS + LOCK_TEST_MARGIN_MS,
  );

  it('should leave the order cancelled with the money returned when the payment arrives after the cancellation', async () => {
    // The session was not closed in time (Stripe was unavailable), and the client paid later.
    gateway.expireCheckoutSession.mockRejectedValue(new ServiceUnavailableException());

    const cancelledCount = await unpaidOrders.cancelExpired();
    await postWebhook(app, WEBHOOK_SIGNATURE).expect(200);

    expect(cancelledCount).toBe(1);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
    expect(gateway.refund).toHaveBeenCalledWith(PAYMENT_REF);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
  });
});
