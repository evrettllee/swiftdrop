import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { ROW_LOCK_UPDATE } from '@/common/constants/database.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { orders, payments, users } from '@/database/schema';
import { NbrbService } from '@/integrations/nbrb/services/nbrb.service';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { AUTH_ERROR_MESSAGES } from '@/modules/auth/constants/access.constants';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { createTestApp } from '@test/support/app';
import { findUserId } from '@test/support/admin';
import { registerUser, validRegistration } from '@test/support/auth';
import { VALID_ORDER } from '@test/support/fixtures';
import { commitOnceBlocked } from '@test/support/locks';
import { placeOrders, postOrder } from '@test/support/orders';
import { createGatewayMock, postPayment, resetGatewayMock, USD_RATE } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

describe('Client actions against a block in progress (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: string;
  let clientId: number;
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
    cookies = (await registerUser(app)).cookies;
    clientId = await findUserId(db, validRegistration.email);
  });

  afterAll(async () => {
    await app.close();
  });

  async function blockInProgress(tx: Transaction): Promise<void> {
    await tx.select().from(users).where(eq(users.userId, clientId)).for(ROW_LOCK_UPDATE);
    await tx.update(users).set({ isBlocked: true }).where(eq(users.userId, clientId));
  }

  it('should refuse an order placement that waited for the block', async () => {
    const response = await commitOnceBlocked(db, blockInProgress, () =>
      postOrder(app, cookies, VALID_ORDER),
    );

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(response.body.message).toBe(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
    expect(await db.select().from(orders).where(eq(orders.clientId, clientId))).toEqual([]);
  });

  it('should refuse a payment start that waited for the block', async () => {
    const [orderId] = await placeOrders(app, cookies, 1);

    const response = await commitOnceBlocked(db, blockInProgress, () =>
      postPayment(app, cookies, { orderId }),
    );

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
    expect(await db.select().from(payments).where(eq(payments.orderId, orderId))).toEqual([]);
  });
});
