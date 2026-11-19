import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import Stripe from 'stripe';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { StripeCheckoutApi } from '@/integrations/stripe/contracts/stripe-checkout.contract';
import { PAYMENTS_ERROR_MESSAGES } from '@/modules/payments/constants/payments.constants';
import { PaymentRefundService } from '@/modules/payments/services/payment-refund.service';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import { FakeStripeCheckoutClient } from '@test/support/fake-stripe';
import { placeOrders } from '@test/support/orders';
import { insertPayment, postWebhook, WEBHOOK_SIGNATURE } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';
import { waitForFailures } from '@test/support/service-failures';

const PAYMENT_INTENT = 'pi_3PqRsTuVwXyZ012345';

class RefusingRefundsClient extends FakeStripeCheckoutClient {
  override createRefund(): Promise<void> {
    return Promise.reject(
      new Stripe.errors.StripeAPIError({
        type: 'api_error',
        code: 'lock_timeout',
        message: `Refund of ${PAYMENT_INTENT} failed`,
      }),
    );
  }
}

describe('Stripe failures (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  const getRoute = jest.fn();

  beforeAll(async () => {
    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: StripeCheckoutApi, useValue: new RefusingRefundsClient() },
    ]);
    db = app.get<Database>(DRIZZLE);
  });

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refuse a webhook with a bad signature as before and record it', async () => {
    const { body } = await postWebhook(app, WEBHOOK_SIGNATURE).expect(HttpStatus.BAD_REQUEST);

    expect(body.message).toBe(PAYMENTS_ERROR_MESSAGES.INVALID_SIGNATURE);
    expect(
      (await waitForFailures(db, 1)).map((row) => [row.service, row.code, row.message]),
    ).toEqual([['stripe', 'webhook_bad_signature', 'Неверная подпись']]);
  });

  it('should record a refund refused by Stripe without the payment id', async () => {
    const { cookies } = await registerUser(app);
    const [orderId] = await placeOrders(app, cookies, 1);
    const paymentId = await insertPayment(db, orderId, {
      status: PAYMENT_STATUS.PAID,
      stripePaymentId: PAYMENT_INTENT,
    });

    await expect(app.get(PaymentRefundService).refundPayment(paymentId)).rejects.toThrow(
      ServiceUnavailableException,
    );

    const rows = await waitForFailures(db, 1);
    expect(rows.map((row) => [row.service, row.code, row.message])).toEqual([
      ['stripe', 'api_error', 'api_error lock_timeout'],
    ]);
    expect(JSON.stringify(rows)).not.toContain(PAYMENT_INTENT);
  });
});
