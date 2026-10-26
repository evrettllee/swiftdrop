import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DB_LOCK_TIMEOUT_MS, DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { NbrbService } from '@/integrations/nbrb/services/nbrb.service';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { ORDERS_ERROR_MESSAGES } from '@/modules/orders/constants/orders.constants';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { PAYMENTS_ERROR_MESSAGES } from '@/modules/payments/constants/payments.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { LOCK_TEST_MARGIN_MS } from '@test/support/constants';
import { holdOrder, whileRowsAreHeld } from '@test/support/locks';
import { cancelOrder, type Cookies, placeOrders, readOrderStatus } from '@test/support/orders';
import { createGatewayMock, postPayment, resetGatewayMock, USD_RATE } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

// Each test waits for the lock timeout itself, so it gets this much more than the timeout.

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
    await resetServiceArea(db, getRoute);
    getUsdRate.mockReset();
    getUsdRate.mockResolvedValue(USD_RATE);
    resetGatewayMock(gateway);

    ({ cookies } = await registerUser(app));
    [orderId] = await placeOrders(app, cookies, 1);
  });

  afterAll(async () => {
    await app.close();
  });

  // A start of the payment that is still talking to Stripe holds the order row like this.
  function whileOrderIsHeld<T>(action: () => Promise<T>): Promise<T> {
    return whileRowsAreHeld(db, holdOrder(orderId), action);
  }

  it(
    'should answer 409 when the payment is started while another start holds the order',
    async () => {
      const response = await whileOrderIsHeld(() => postPayment(app, cookies, { orderId }));

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.message).toBe(PAYMENTS_ERROR_MESSAGES.PAYMENT_ALREADY_STARTED);
      expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
    },
    DB_LOCK_TIMEOUT_MS + LOCK_TEST_MARGIN_MS,
  );

  it(
    'should answer 409 and keep the order when it is cancelled while another operation holds it',
    async () => {
      const response = await whileOrderIsHeld(() => cancelOrder(app, cookies, orderId));

      expect(response.status).toBe(HttpStatus.CONFLICT);
      expect(response.body.message).toBe(ORDERS_ERROR_MESSAGES.BUSY);
      expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.PENDING);
    },
    DB_LOCK_TIMEOUT_MS + LOCK_TEST_MARGIN_MS,
  );
});
