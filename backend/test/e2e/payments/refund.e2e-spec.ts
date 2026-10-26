import { ServiceUnavailableException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { PaymentRefundService } from '@/modules/payments/services/payment-refund.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { placeOrders } from '@test/support/orders';
import {
  createGatewayMock,
  insertPayment,
  readPaymentStatus,
  resetGatewayMock,
  PAYMENT_REF,
} from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

describe('Payment refund (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let refunds: PaymentRefundService;
  let orderId: number;
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
    refunds = app.get(PaymentRefundService);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
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
      stripePaymentId: PAYMENT_REF,
    });

    const result = await refunds.refundPayment(paymentId);

    expect(result).toBe(true);
    expect(gateway.refund).toHaveBeenCalledWith(PAYMENT_REF);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
  });

  it('should do nothing when the payment is still pending', async () => {
    const paymentId = await insertPayment(db, orderId);

    const result = await refunds.refundPayment(paymentId);

    expect(result).toBe(false);
    expect(gateway.refund).not.toHaveBeenCalled();
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PENDING);
  });

  it('should refund once when the refund is requested twice', async () => {
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: PAYMENT_REF,
    });

    await refunds.refundPayment(paymentId);
    const secondResult = await refunds.refundPayment(paymentId);

    expect(secondResult).toBe(false);
    expect(gateway.refund).toHaveBeenCalledTimes(1);
  });

  it('should keep the payment paid and pass the error on when the gateway fails', async () => {
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: PAYMENT_REF,
    });
    gateway.refund.mockRejectedValue(new ServiceUnavailableException());

    await expect(refunds.refundPayment(paymentId)).rejects.toThrow(ServiceUnavailableException);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PAID);
  });

  it('should refund every paid payment of the order and skip the others when an order is refunded', async () => {
    const firstPaid = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: PAYMENT_REF,
    });
    const secondPaid = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: 'pi_test_2',
    });
    const failed = await insertPayment(db, orderId, { status: PAYMENT_STATUS.FAILED });

    const count = await refunds.refundOrderPayments(orderId);

    expect(count).toBe(2);
    expect(await readPaymentStatus(db, firstPaid)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readPaymentStatus(db, secondPaid)).toBe(PAYMENT_STATUS.REFUNDED);
    expect(await readPaymentStatus(db, failed)).toBe(PAYMENT_STATUS.FAILED);
  });
});
