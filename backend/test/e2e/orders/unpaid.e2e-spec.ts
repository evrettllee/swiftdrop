import { ServiceUnavailableException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { MS_PER_MINUTE } from '../../../src/common/constants/time.constants';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../../../src/common/enums/payment-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders, orderStatusHistory } from '../../../src/db/schema';
import { OsrmService } from '../../../src/integrations/osrm/osrm.service';
import { UNPAID_ORDER_TTL_MS } from '../../../src/orders/orders.constants';
import { UnpaidOrdersService } from '../../../src/orders/services/unpaid-orders.service';
import { PaymentGateway } from '../../../src/payments/gateway/payment.gateway';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { resetTestData, seedServiceArea } from '../../support/database';
import { ROUTE } from '../../support/fixtures';
import { placeOrders, readOrderStatus } from '../../support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  readPaymentStatus,
  resetGatewayMock,
} from '../../support/payments';

describe('Unpaid orders cancellation (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let unpaidOrders: UnpaidOrdersService;
  let orderIds: number[];
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  async function makeOld(orderId: number): Promise<void> {
    const createdAt = new Date(Date.now() - UNPAID_ORDER_TTL_MS - MS_PER_MINUTE);

    await db.update(orders).set({ createdAt }).where(eq(orders.orderId, orderId));
  }

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
    orderIds = await placeOrders(app, cookies, 2);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cancel the order and record the system as the author when it is unpaid for too long', async () => {
    const [orderId] = orderIds;
    await makeOld(orderId);

    const count = await unpaidOrders.cancelExpired();

    const history = await db
      .select({ status: orderStatusHistory.status, changedBy: orderStatusHistory.changedBy })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId));
    expect(count).toBe(1);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
    expect(history).toContainEqual({ status: ORDER_STATUS.CANCELLED, changedBy: null });
  });

  it('should close the payment session and mark the payment failed when the order is cancelled', async () => {
    const [orderId] = orderIds;
    await makeOld(orderId);
    const paymentId = await insertPayment(db, orderId, {
      checkoutSessionId: CHECKOUT_SESSION.sessionId,
    });

    await unpaidOrders.cancelExpired();

    expect(gateway.expireCheckoutSession).toHaveBeenCalledWith(CHECKOUT_SESSION.sessionId);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.FAILED);
  });

  it('should leave a fresh order alone when the time has not passed yet', async () => {
    const [orderId] = orderIds;

    const count = await unpaidOrders.cancelExpired();

    expect(count).toBe(0);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.PENDING);
  });

  it('should leave an old order alone when it is already confirmed', async () => {
    const [orderId] = orderIds;
    await makeOld(orderId);
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.CONFIRMED })
      .where(eq(orders.orderId, orderId));

    const count = await unpaidOrders.cancelExpired();

    expect(count).toBe(0);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
  });

  it('should cancel the other orders when one of them fails', async () => {
    const [failingId, healthyId] = orderIds;
    await makeOld(failingId);
    await makeOld(healthyId);
    await insertPayment(db, failingId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: 'pi_test_1',
    });
    gateway.refund.mockRejectedValue(new ServiceUnavailableException());

    const count = await unpaidOrders.cancelExpired();

    expect(count).toBe(1);
    expect(await readOrderStatus(db, failingId)).toBe(ORDER_STATUS.PENDING);
    expect(await readOrderStatus(db, healthyId)).toBe(ORDER_STATUS.CANCELLED);
  });
});
