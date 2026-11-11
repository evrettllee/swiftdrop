import { BadRequestException, HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { placeOrders, readOrderStatus } from '@test/support/orders';
import {
  CHECKOUT_SESSION,
  createGatewayMock,
  insertPayment,
  postWebhook,
  readPaymentStatus,
  resetGatewayMock,
  WEBHOOK_SIGNATURE,
} from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

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
    await resetServiceArea(db, getRoute);
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

    expect(response.status).toBe(HttpStatus.OK);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PENDING);
  });

  it('should answer 400 and not touch the gateway when the signature header is missing', async () => {
    const response = await postWebhook(app);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(gateway.parseWebhook).not.toHaveBeenCalled();
  });

  it('should answer 400 and change nothing when the signature is wrong', async () => {
    gateway.parseWebhook.mockImplementation(() => {
      throw new BadRequestException();
    });

    const response = await postWebhook(app, WEBHOOK_SIGNATURE);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(await readPaymentStatus(db, paymentId)).toBe(PAYMENT_STATUS.PENDING);
    expect(await readOrderStatus(db, orderId)).toBe(ORDER_STATUS.PENDING);
  });
});
