import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ORDERS_ROUTES } from '@/modules/orders/constants/orders.constants';
import { createTestApp } from '@test/support/app';
import { COOKIE_HEADER, registerUser } from '@test/support/auth';
import { getApi } from '@test/support/http';
import { type Cookies, placeOrders } from '@test/support/orders';
import { insertPayment, PAYMENT_REF, VALID_ORDER_AMOUNT_USD } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

describe('Order details payment (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: Cookies;
  let orderId: number;
  const getRoute = jest.fn();

  function getDetails() {
    return getApi(app, `${ORDERS_ROUTES.BASE}/${orderId}`).set(COOKIE_HEADER, cookies);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);

    ({ cookies } = await registerUser(app));
    [orderId] = await placeOrders(app, cookies, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return null payment when the payment was never started', async () => {
    const response = await getDetails();

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.payment).toBeNull();
  });

  it('should return the status and the dollar amount when the payment is pending', async () => {
    await insertPayment(db, orderId);

    const response = await getDetails();

    expect(response.body.payment).toEqual({
      status: PAYMENT_STATUS.PENDING,
      amountUsd: VALID_ORDER_AMOUNT_USD,
    });
  });

  it('should return the newest payment when there were several attempts', async () => {
    await insertPayment(db, orderId, { status: PAYMENT_STATUS.FAILED });
    await insertPayment(db, orderId, { status: PAYMENT_STATUS.PAID, stripePaymentId: PAYMENT_REF });

    const response = await getDetails();

    expect(response.body.payment.status).toBe(PAYMENT_STATUS.PAID);
  });
});
