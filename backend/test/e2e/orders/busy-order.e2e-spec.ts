import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { DB_LOCK_TIMEOUT_MS, DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { orders } from '../../../src/db/schema';
import { NbrbService } from '../../../src/integrations/nbrb/nbrb.service';
import { OsrmService } from '../../../src/integrations/osrm/osrm.service';
import { ORDERS_ERROR_MESSAGES } from '../../../src/orders/orders.constants';
import { PaymentGateway } from '../../../src/payments/gateway/payment.gateway';
import { PAYMENTS_ERROR_MESSAGES } from '../../../src/payments/payments.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { resetTestData, seedServiceArea } from '../../support/database';
import { ROUTE } from '../../support/fixtures';
import { cancelOrder, type Cookies, placeOrders, readOrderStatus } from '../../support/orders';
import {
  createGatewayMock,
  postPayment,
  resetGatewayMock,
  USD_RATE,
} from '../../support/payments';

const HTTP_CONFLICT = 409;
// Each test waits for the lock timeout itself, so it gets this much more than the timeout.
const LOCK_TEST_MARGIN_MS = 10_000;

describe('Order held by another operation (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: Cookies;
  let orderId: number;
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

    ({ cookies } = await registerUser(app));
    [orderId] = await placeOrders(app, cookies, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  // Runs `action` while another transaction holds the order row, as a start of the payment that
  // is still talking to Stripe does.
  async function whileOrderIsHeld<T>(action: () => Promise<T>): Promise<T> {
    const lockTaken = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const holder = db.transaction(async (tx) => {
      await tx.select().from(orders).where(eq(orders.orderId, orderId)).for('no key update');
      lockTaken.resolve();
      await release.promise;
    });

    await lockTaken.promise;

    try {
      return await action();
    } finally {
      release.resolve();
      await holder;
    }
  }

  it(
    'should answer 409 when the payment is started while another start holds the order',
    async () => {
      const response = await whileOrderIsHeld(() => postPayment(app, cookies, { orderId }));

      expect(response.status).toBe(HTTP_CONFLICT);
      expect(response.body.message).toBe(PAYMENTS_ERROR_MESSAGES.PAYMENT_ALREADY_STARTED);
      expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
    },
    DB_LOCK_TIMEOUT_MS + LOCK_TEST_MARGIN_MS,
  );

  it(
    'should answer 409 and keep the order when it is cancelled while another operation holds it',
    async () => {
      const response = await whileOrderIsHeld(() => cancelOrder(app, cookies, orderId));

      expect(response.status).toBe(HTTP_CONFLICT);
      expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.BUSY);
      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.PENDING);
    },
    DB_LOCK_TIMEOUT_MS + LOCK_TEST_MARGIN_MS,
  );
});
