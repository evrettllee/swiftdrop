import { ServiceUnavailableException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { PAYMENT_STATUS } from '../../src/common/enums/payment-status.enum';
import { DRIZZLE } from '../../src/database/database.constants';
import type { Database } from '../../src/database/database.module';
import { payments } from '../../src/db/schema';
import { OsrmService } from '../../src/integrations/osrm/osrm.service';
import { PaymentGateway } from '../../src/payments/gateway/payment.gateway';
import { PaymentRefundService } from '../../src/payments/services/payment-refund.service';
import { createTestApp } from '../support/app';
import { registerUser } from '../support/auth';
import { resetTestData, seedServiceArea } from '../support/database';
import { ROUTE } from '../support/fixtures';
import { placeOrders } from '../support/orders';
import { createGatewayMock, insertPayment, resetGatewayMock } from '../support/payments';

describe('Payment refund (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let refunds: PaymentRefundService;
  let orderId: number;
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  async function readStatus(paymentId: number): Promise<string> {
    const [payment] = await db
      .select({ status: payments.status })
      .from(payments)
      .where(eq(payments.paymentId, paymentId));

    return payment.status;
  }

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
    refunds = app.get(PaymentRefundService);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
    getRoute.mockReset();
    getRoute.mockResolvedValue(ROUTE);
    resetGatewayMock(gateway);

    const { cookies } = await registerUser(app);
    [orderId] = await placeOrders(app, cookies, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refund through the gateway and mark the payment refunded when it is paid', async () => {
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: 'pi_test_1',
    });

    const result = await refunds.refundPayment(paymentId);

    expect(result).toBe(true);
    expect(gateway.refund).toHaveBeenCalledWith('pi_test_1');
    expect(await readStatus(paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
  });

  it('should do nothing when the payment is still pending', async () => {
    const paymentId = await insertPayment(db, orderId);

    const result = await refunds.refundPayment(paymentId);

    expect(result).toBe(false);
    expect(gateway.refund).not.toHaveBeenCalled();
    expect(await readStatus(paymentId)).toBe(PAYMENT_STATUS.PENDING);
  });

  it('should refund once when the refund is requested twice', async () => {
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: 'pi_test_1',
    });

    await refunds.refundPayment(paymentId);
    const secondResult = await refunds.refundPayment(paymentId);

    expect(secondResult).toBe(false);
    expect(gateway.refund).toHaveBeenCalledTimes(1);
  });

  it('should keep the payment paid and pass the error on when the gateway fails', async () => {
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: 'pi_test_1',
    });
    gateway.refund.mockRejectedValue(new ServiceUnavailableException());

    await expect(refunds.refundPayment(paymentId)).rejects.toThrow(ServiceUnavailableException);
    expect(await readStatus(paymentId)).toBe(PAYMENT_STATUS.PAID);
  });

  it('should refund every paid payment of the order and skip the others when an order is refunded', async () => {
    const firstPaid = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: 'pi_test_1',
    });
    const secondPaid = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: 'pi_test_2',
    });
    const failed = await insertPayment(db, orderId, { status: PAYMENT_STATUS.FAILED });

    const count = await refunds.refundOrderPayments(orderId);

    expect(count).toBe(2);
    expect(await readStatus(firstPaid)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readStatus(secondPaid)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readStatus(failed)).toBe(PAYMENT_STATUS.FAILED);
  });
});
