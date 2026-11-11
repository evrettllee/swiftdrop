import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { exchangeRates, payments } from '@/database/schema';
import {
  NBRB_ERROR_MESSAGES,
  NBRB_RATE_CURRENCY,
} from '@/integrations/nbrb/constants/nbrb.constants';
import { NbrbClient } from '@/integrations/nbrb/services/nbrb-client.service';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { APP_HOOK_TIMEOUT_MS } from '@test/support/constants';
import { placeOrders } from '@test/support/orders';
import { createGatewayMock, postPayment, resetGatewayMock, USD_RATE } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

const SAVED_RATE = 2.9876;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

describe('Payments exchange rate (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();
  const fetchUsdRate = jest.fn<Promise<number>, []>();
  const gateway = createGatewayMock();

  async function saveRateHoursAgo(hours: number): Promise<void> {
    await db.insert(exchangeRates).values({
      currency: NBRB_RATE_CURRENCY,
      rate: SAVED_RATE,
      fetchedAt: new Date(Date.now() - hours * MS_PER_HOUR),
    });
  }

  async function payNewOrder(status: HttpStatus) {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);

    return postPayment(app, cookies, { orderId }).expect(status);
  }

  beforeEach(async () => {
    fetchUsdRate.mockReset().mockRejectedValue(new Error('NBRB is down'));
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: NbrbClient, useValue: { fetchUsdRate } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
    await resetServiceArea(db, getRoute);
    resetGatewayMock(gateway);
  }, APP_HOOK_TIMEOUT_MS);

  afterEach(async () => {
    await app.close();
  });

  it('should pay by the fresh NBRB rate and save it', async () => {
    fetchUsdRate.mockResolvedValue(USD_RATE);

    await payNewOrder(HttpStatus.CREATED);

    expect(await db.select().from(exchangeRates)).toEqual([
      { currency: NBRB_RATE_CURRENCY, rate: USD_RATE, fetchedAt: expect.any(Date) },
    ]);
    expect((await db.select().from(payments))[0]?.exchangeRate).toBe(USD_RATE);
  });

  it('should pay by the saved rate of 71 hours when NBRB fails', async () => {
    await saveRateHoursAgo(71);

    await payNewOrder(HttpStatus.CREATED);

    expect((await db.select().from(payments))[0]?.exchangeRate).toBe(SAVED_RATE);
  });

  it('should return 503 and open no session when NBRB fails and the saved rate is 73 hours old', async () => {
    await saveRateHoursAgo(73);

    const response = await payNewOrder(HttpStatus.SERVICE_UNAVAILABLE);

    expect(response.body.message).toBe(NBRB_ERROR_MESSAGES.RATE_UNAVAILABLE);
    expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('should return 503 when NBRB fails and no rate was ever saved', async () => {
    const response = await payNewOrder(HttpStatus.SERVICE_UNAVAILABLE);

    expect(response.body.message).toBe(NBRB_ERROR_MESSAGES.RATE_UNAVAILABLE);
    expect(await db.select().from(payments)).toHaveLength(0);
  });
});
