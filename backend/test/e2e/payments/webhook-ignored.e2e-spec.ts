import { BadRequestException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '../../../src/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '../../../src/common/enums/payment-status.enum';
import { DRIZZLE } from '../../../src/database/database.constants';
import type { Database } from '../../../src/database/database.module';
import { OsrmService } from '../../../src/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '../../../src/modules/payments/contracts/payment-gateway.contract';
import { createTestApp } from '../../support/app';
import { registerUser } from '../../support/auth';
import { resetTestData, seedServiceArea } from '../../support/database';
import { ROUTE } from '../../support/fixtures';
import { placeOrders, readOrderStatus } from '../../support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  postWebhook,
  readPaymentStatus,
  resetGatewayMock,
  WEBHOOK_SIGNATURE,
} from '../../support/payments';

describe('Payment webhook (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let orderId: number;
  let paymentId: number;
  const getRoute = jest.fn();
  const gateway = createGatewayMock();

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetTestData(db);
    await seedServiceArea(db);
    getRoute.mockReset();
    getRoute.mockResolvedValue(ROUTE);
    resetGatewayMock(gateway);

    const { cookies } = await registerUser(app);
    [orderId] = await placeOrders(app, cookies, 1);
    paymentId = await insertPayment(db, orderId, { checkoutSessionId: CHECKOUT_SESSION.sessionId });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should answer 200 and change nothing when the event is of no interest', async () => {
    gateway.parseWebhook.mockReturnValue(null);

    const response = await postWebhook(app, WEBHOOK_SIGNATURE);

    expect(response.status).toBe(200);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PENDING);
  });

  it('should answer 400 and not touch the gateway when the signature header is missing', async () => {
    const response = await postWebhook(app);

    expect(response.status).toBe(400);
    expect(gateway.parseWebhook).not.toHaveBeenCalled();
  });

  it('should answer 400 and change nothing when the signature is wrong', async () => {
    gateway.parseWebhook.mockImplementation(() => {
      throw new BadRequestException();
    });

    const response = await postWebhook(app, WEBHOOK_SIGNATURE);

    expect(response.status).toBe(400);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PENDING);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.PENDING);
  });
});
