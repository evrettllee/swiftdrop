import { HttpStatus } from '@nestjs/common';
import { setTimeout as delay } from 'node:timers/promises';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { and, eq } from 'drizzle-orm';
import { PAYMENT_STATUS } from '../../../src/common/enums/payment-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { payments } from '../../../src/database/schema';
import { NbrbService } from '../../../src/integrations/nbrb/services/nbrb.service';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '../../../src/modules/payments/contracts/payment-gateway.contract';
import { PAYMENTS_ERROR_MESSAGES } from '../../../src/modules/payments/constants/payments.constants';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { type Cookies, placeOrders } from '../../support/orders';
import {
  createGatewayMock,
  insertPayment,
  postPayment,
  resetGatewayMock,
  USD_RATE,
} from '../../support/payments';
import { resetServiceArea } from '../../support/pricing';

const PARALLEL_ATTEMPTS = 2;
// Long enough for both requests to pass the check of open attempts before either saves its own.
const GATEWAY_DELAY_MS = 100;
const SESSION_ID_PREFIX = 'cs_test_race_';
const CHECKOUT_URL_PREFIX = 'https://checkout.stripe.test/pay/';
const RACING_SESSION_ID = 'cs_test_racing';

describe('Parallel payments of one order (e2e)', () => {
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

  function readOpenAttempts() {
    return db
      .select({ paymentId: payments.paymentId })
      .from(payments)
      .where(and(eq(payments.orderId, orderId), eq(payments.status, PAYMENT_STATUS.PENDING)));
  }

  // Every session gets its own id, and the gateway answers slowly, as Stripe does over the network.
  function slowDistinctSessions(): void {
    let sessionNumber = 0;

    gateway.createCheckoutSession.mockImplementation(async () => {
      sessionNumber += 1;
      const sessionId = `${SESSION_ID_PREFIX}${sessionNumber}`;
      await delay(GATEWAY_DELAY_MS);

      return { sessionId, url: `${CHECKOUT_URL_PREFIX}${sessionId}` };
    });
  }

  function payTwiceAtOnce() {
    return Promise.all(
      Array.from({ length: PARALLEL_ATTEMPTS }, () => postPayment(app, cookies, { orderId })),
    );
  }

  it('should leave one open session when the order is paid twice at once', async () => {
    slowDistinctSessions();

    await payTwiceAtOnce();

    // The second start waited for the first one and closed its session before opening its own.
    expect(gateway.createCheckoutSession).toHaveBeenCalledTimes(PARALLEL_ATTEMPTS);
    expect(gateway.expireCheckoutSession).toHaveBeenCalledTimes(1);
    expect(await readOpenAttempts()).toHaveLength(1);
  });

  it('should close the new session and answer 409 when another open attempt got saved meanwhile', async () => {
    gateway.createCheckoutSession.mockImplementation(async () => {
      // Another open attempt appears while the session is being created.
      await insertPayment(db, orderId);

      return { sessionId: RACING_SESSION_ID, url: `${CHECKOUT_URL_PREFIX}${RACING_SESSION_ID}` };
    });

    const response = await postPayment(app, cookies, { orderId }).expect(HttpStatus.CONFLICT);

    expect(response.body.message).toBe(PAYMENTS_ERROR_MESSAGES.PAYMENT_ALREADY_STARTED);
    expect(gateway.expireCheckoutSession).toHaveBeenCalledWith(RACING_SESSION_ID);
    expect(await readOpenAttempts()).toHaveLength(1);
  });
});
