import { ServiceUnavailableException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders, payments } from '../../../src/db/schema';
import { NBRB_ERROR_MESSAGES } from '../../../src/integrations/nbrb/nbrb.constants';
import { NbrbService } from '../../../src/integrations/nbrb/nbrb.service';
import { OsrmService } from '../../../src/integrations/osrm/osrm.service';
import { ORDERS_ERROR_MESSAGES } from '../../../src/orders/orders.constants';
import { PaymentGateway } from '../../../src/payments/gateway/payment.gateway';
import { PAYMENTS_ERROR_MESSAGES } from '../../../src/payments/payments.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { resetTestData, seedServiceArea } from '../../support/database';
import { ROUTE } from '../../support/fixtures';
import { placeOrders, SECOND_CLIENT } from '../../support/orders';
import { createGatewayMock, postPayment, resetGatewayMock, USD_RATE } from '../../support/payments';

const MISSING_ORDER_ID = 999_999;
// At this rate 9.23 BYN is one cent, below the 50 cents that Stripe accepts.
const TINY_AMOUNT_RATE = 1000;

describe('Payments rejections (e2e)', () => {
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
    await resetTestData(db);
    await seedServiceArea(db);
    getRoute.mockReset();
    getRoute.mockResolvedValue(ROUTE);
    getUsdRate.mockReset();
    getUsdRate.mockResolvedValue(USD_RATE);
    resetGatewayMock(gateway);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 409 and open no session when the order is not pending', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);
    await db
      .update(orders)
      .set({ status: ORDER_STATUS.CANCELLED })
      .where(eq(orders.orderId, orderId));

    const response = await postPayment(app, cookies, { orderId }).expect(409);

    expect(response.body.message).toBe(PAYMENTS_ERROR_MESSAGES.ORDER_NOT_PAYABLE);
    expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('should return 404 and open no session when the order belongs to another client', async () => {
    const { cookies } = await registerUser(app);
    const { cookies: otherCookies } = await registerUser(app, SECOND_CLIENT);
    const [orderId] = await placeOrders(app, cookies, 1);

    const response = await postPayment(app, otherCookies, { orderId }).expect(404);

    expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.NOT_FOUND);
    expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('should return 404 when the order does not exist', async () => {
    const { cookies } = await registerUser(app);

    const response = await postPayment(app, cookies, { orderId: MISSING_ORDER_ID }).expect(404);

    expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.NOT_FOUND);
  });

  it('should return 422 and open no session when the amount is below the minimum charge', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);
    getUsdRate.mockResolvedValue(TINY_AMOUNT_RATE);

    const response = await postPayment(app, cookies, { orderId }).expect(422);

    expect(response.body.message).toBe(PAYMENTS_ERROR_MESSAGES.AMOUNT_TOO_SMALL);
    expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
    expect(await db.select().from(payments)).toHaveLength(0);
  });

  it('should return 503 and open no session when the exchange rate is unavailable', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);
    getUsdRate.mockRejectedValue(
      new ServiceUnavailableException(NBRB_ERROR_MESSAGES.RATE_UNAVAILABLE),
    );

    const response = await postPayment(app, cookies, { orderId }).expect(503);

    expect(response.body.message).toBe(NBRB_ERROR_MESSAGES.RATE_UNAVAILABLE);
    expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
  });
});
