import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { exchangeRates } from '@/database/schema';
import {
  NBRB_ERROR_MESSAGES,
  NBRB_RATE_CURRENCY,
} from '@/integrations/nbrb/constants/nbrb.constants';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { APP_HOOK_TIMEOUT_MS } from '@test/support/constants';
import { placeOrders } from '@test/support/orders';
import { createGatewayMock, postPayment, resetGatewayMock } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';
import { networkError, stubFetch, waitForFailures } from '@test/support/service-failures';

const SAVED_AT = new Date(Date.now() - 2 * 60 * 60 * 1000);
const SAVED_DATE = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Minsk',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(SAVED_AT);

describe('NBRB failures during a payment (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  async function payNewOrder(status: HttpStatus) {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);

    return postPayment(app, cookies, { orderId }).expect(status);
  }

  beforeEach(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
    resetGatewayMock(gateway);
    stubFetch(() => Promise.reject(networkError('ECONNREFUSED')));
  }, APP_HOOK_TIMEOUT_MS);

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('should pay by the saved rate and record its use with the date only', async () => {
    await db
      .insert(exchangeRates)
      .values({ currency: NBRB_RATE_CURRENCY, rate: 2.9876, fetchedAt: SAVED_AT });

    await payNewOrder(HttpStatus.CREATED);

    const rows = await waitForFailures(db, 2);
    expect(rows.map((row) => [row.service, row.code, row.message])).toEqual(
      expect.arrayContaining([
        ['nbrb', 'unavailable', 'ECONNREFUSED'],
        ['nbrb', 'saved_rate_used', `Курс от ${SAVED_DATE}`],
      ]),
    );
    expect(rows).toHaveLength(2);
  });

  it('should keep the existing error and record the unavailable NBRB without a saved rate', async () => {
    const { body } = await payNewOrder(HttpStatus.SERVICE_UNAVAILABLE);

    expect(body.message).toBe(NBRB_ERROR_MESSAGES.RATE_UNAVAILABLE);
    expect(
      (await waitForFailures(db, 1)).map((row) => [row.service, row.code, row.message]),
    ).toEqual([['nbrb', 'unavailable', 'ECONNREFUSED']]);
  });
});
