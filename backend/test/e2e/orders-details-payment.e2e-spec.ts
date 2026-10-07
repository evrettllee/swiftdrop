import type { NestExpressApplication } from '@nestjs/platform-express';
import { PAYMENT_STATUS } from '../../src/common/enums/payment-status.enum';
import { DRIZZLE } from '../../src/database/database.constants';
import type { Database } from '../../src/database/database.module';
import { OsrmService } from '../../src/integrations/osrm/osrm.service';
import { ORDERS_ROUTES } from '../../src/orders/orders.constants';
import { createTestApp } from '../support/app';
import { registerUser } from '../support/auth';
import { resetTestData, seedServiceArea } from '../support/database';
import { ROUTE } from '../support/fixtures';
import { getApi } from '../support/http';
import { type Cookies, placeOrders } from '../support/orders';
import { insertPayment } from '../support/payments';

describe('Order details payment (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: Cookies;
  let orderId: number;
  const getRoute = jest.fn();

  function getDetails() {
    return getApi(app, `${ORDERS_ROUTES.BASE}/${orderId}`).set('Cookie', cookies);
  }

  beforeAll(async () => {
    app = await createTestApp([{ token: OsrmService, useValue: { getRoute } }]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
    getRoute.mockReset();
    getRoute.mockResolvedValue(ROUTE);

    ({ cookies } = await registerUser(app));
    [orderId] = await placeOrders(app, cookies, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return null payment when the payment was never started', async () => {
    const response = await getDetails();

    expect(response.status).toBe(200);
    expect(response.body.payment).toBeNull();
  });

  it('should return the status and the dollar amount when the payment is pending', async () => {
    await insertPayment(db, orderId);

    const response = await getDetails();

    expect(response.body.payment).toEqual({ status: PAYMENT_STATUS.PENDING, amountUsd: 3.04 });
  });

  it('should return the newest payment when there were several attempts', async () => {
    await insertPayment(db, orderId, { status: PAYMENT_STATUS.FAILED });
    await insertPayment(db, orderId, { status: PAYMENT_STATUS.PAID, stripePaymentId: 'pi_test_1' });

    const response = await getDetails();

    expect(response.body.payment.status).toBe(PAYMENT_STATUS.PAID);
  });
});
