import { ServiceUnavailableException, HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc } from 'drizzle-orm';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { payments } from '@/database/schema';
import { NbrbService } from '@/integrations/nbrb/services/nbrb.service';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ORDERS_VALIDATION_MESSAGES } from '@/modules/orders/constants/orders.constants';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import {
  PAYMENT_CURRENCY,
  PAYMENT_DESCRIPTION_PREFIX,
  PAYMENTS_ROUTES,
} from '@/modules/payments/constants/payments.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { VALID_ORDER_PRICE_TEXT } from '@test/support/fixtures';
import { postApi } from '@test/support/http';
import { placeOrders } from '@test/support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  postPayment,
  resetGatewayMock,
  USD_RATE,
  VALID_ORDER_AMOUNT_USD_TEXT,
} from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

describe('Payments (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();
  const getUsdRate = jest.fn();
  const gateway = createGatewayMock();

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: NbrbService, useValue: { getUsdRate } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    getUsdRate.mockReset();
    getUsdRate.mockResolvedValue(USD_RATE);
    resetGatewayMock(gateway);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return the checkout url and save a pending payment when the order is pending', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);

    const response = await postPayment(app, cookies, { orderId }).expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      paymentId: expect.any(Number),
      checkoutUrl: CHECKOUT_SESSION.url,
    });
    expect(gateway.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId,
        amountMinor: 304,
        currency: PAYMENT_CURRENCY,
        description: `${PAYMENT_DESCRIPTION_PREFIX}${orderId}`,
        successUrl: expect.stringContaining(`/orders/${orderId}?payment=success`),
        cancelUrl: expect.stringContaining(`/orders/${orderId}?payment=cancelled`),
      }),
    );

    const [payment] = await db.select().from(payments);

    expect(payment).toMatchObject({
      orderId,
      amount: VALID_ORDER_PRICE_TEXT,
      amountUsd: VALID_ORDER_AMOUNT_USD_TEXT,
      exchangeRate: USD_RATE,
      status: PAYMENT_STATUS.PENDING,
      checkoutSessionId: CHECKOUT_SESSION.sessionId,
    });
  });

  it('should close the earlier attempt and mark it failed when the client pays twice', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);
    gateway.createCheckoutSession
      .mockResolvedValueOnce({ sessionId: 'cs_first', url: 'https://checkout.stripe.test/first' })
      .mockResolvedValueOnce({
        sessionId: 'cs_second',
        url: 'https://checkout.stripe.test/second',
      });

    await postPayment(app, cookies, { orderId }).expect(HttpStatus.CREATED);
    await postPayment(app, cookies, { orderId }).expect(HttpStatus.CREATED);

    const rows = await db.select().from(payments).orderBy(asc(payments.paymentId));

    expect(gateway.expireCheckoutSession).toHaveBeenCalledWith('cs_first');
    expect(rows.map((row) => [row.checkoutSessionId, row.status])).toEqual([
      ['cs_first', PAYMENT_STATUS.FAILED],
      ['cs_second', PAYMENT_STATUS.PENDING],
    ]);
  });

  it('should answer 503 and open no new session when the earlier session cannot be closed', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);
    await postPayment(app, cookies, { orderId }).expect(HttpStatus.CREATED);
    gateway.expireCheckoutSession.mockRejectedValue(new ServiceUnavailableException());

    await postPayment(app, cookies, { orderId }).expect(HttpStatus.SERVICE_UNAVAILABLE);

    const rows = await db.select().from(payments);

    expect(gateway.createCheckoutSession).toHaveBeenCalledTimes(1);
    expect(rows.map((row) => row.status)).toEqual([PAYMENT_STATUS.PENDING]);
  });

  it('should return 400 with a field error when the order id is not a number', async () => {
    const { cookies } = await registerUser(app);

    const response = await postPayment(app, cookies, { orderId: 'abc' }).expect(
      HttpStatus.BAD_REQUEST,
    );

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'orderId',
          message: ORDERS_VALIDATION_MESSAGES.ORDER_ID_INVALID,
        }),
      ]),
    );
  });

  it('should return 401 when the request has no authentication', async () => {
    await postApi(app, PAYMENTS_ROUTES.BASE).send({ orderId: 1 }).expect(HttpStatus.UNAUTHORIZED);
  });
});
