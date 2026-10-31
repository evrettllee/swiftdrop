import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { SESSION_EXPIRE_RESULT } from '@/modules/payments/constants/payments.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { createManager } from '@test/support/manager';
import { postManagerCancel } from '@test/support/manager-assignment';
import { placeOrders, readOrderStatus, setOrderStatus } from '@test/support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  PAYMENT_REF,
  readPaymentStatus,
  resetGatewayMock,
} from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

const BODY = { reason: 'Адрес доставки вне зоны' };

describe('Payments of an order cancelled by a manager (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let manager: string;
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
    const { cookies } = await registerUser(app);
    [orderId] = await placeOrders(app, cookies, 1);
    manager = await createManager(app, db);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refund a paid order', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: PAYMENT_REF,
    });

    const response = await postManagerCancel(app, manager, orderId, BODY).expect(HttpStatus.OK);

    expect(response.body).toEqual({ orderId, status: ORDER_STATUS.CANCELLED, refund: 'refunded' });
    expect(gateway.refund).toHaveBeenCalledWith(PAYMENT_REF);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.REFUNDED);
  });

  it('should close the payment session of an unpaid order and refund nothing', async () => {
    const paymentId = await insertPayment(db, orderId, {
      checkoutSessionId: CHECKOUT_SESSION.sessionId,
    });

    const response = await postManagerCancel(app, manager, orderId, BODY).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({ refund: 'none' });
    expect(gateway.expireCheckoutSession).toHaveBeenCalledWith(CHECKOUT_SESSION.sessionId);
    expect(gateway.refund).not.toHaveBeenCalled();
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.FAILED);
  });

  it('should leave a session that stayed open to the webhook and answer pending', async () => {
    const paymentId = await insertPayment(db, orderId, {
      checkoutSessionId: CHECKOUT_SESSION.sessionId,
    });
    gateway.expireCheckoutSession.mockResolvedValueOnce(SESSION_EXPIRE_RESULT.NOT_OPEN);

    const response = await postManagerCancel(app, manager, orderId, BODY).expect(HttpStatus.OK);

    expect(response.body).toMatchObject({ refund: 'pending' });
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PENDING);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CANCELLED);
  });

  it('should keep the order as it was when the refund fails', async () => {
    await setOrderStatus(db, orderId, ORDER_STATUS.CONFIRMED);
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: PAYMENT_REF,
    });
    gateway.refund.mockRejectedValueOnce(new ServiceUnavailableException());

    await postManagerCancel(app, manager, orderId, BODY).expect(HttpStatus.SERVICE_UNAVAILABLE);

    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.CONFIRMED);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PAID);
  });
});
