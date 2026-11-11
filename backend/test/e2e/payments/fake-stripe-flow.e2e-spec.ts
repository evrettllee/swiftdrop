import { HttpStatus } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { asc } from 'drizzle-orm';
import Stripe from 'stripe';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { ENV_KEYS } from '@/config/env.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { payments } from '@/database/schema';
import { NbrbService } from '@/integrations/nbrb/services/nbrb.service';
import { OsrmService } from '@/integrations/osrm/services/osrm.service';
import { StripePaymentAdapter } from '@/integrations/stripe/adapters/stripe-payment.adapter';
import { STRIPE_EVENT } from '@/integrations/stripe/constants/stripe.constants';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import {
  PAYMENTS_ROUTES,
  WEBHOOK_SIGNATURE_HEADER,
} from '@/modules/payments/constants/payments.constants';
import { createTestApp } from '@test/support/app';
import { registerUser } from '@test/support/auth';
import {
  APP_HOOK_TIMEOUT_MS,
  CONTENT_TYPE_HEADER,
  JSON_CONTENT_TYPE,
} from '@test/support/constants';
import { FAKE_CHECKOUT_PAGE_URL, FakeStripeCheckoutClient } from '@test/support/fake-stripe';
import { rawPostApi } from '@test/support/http';
import { createManager } from '@test/support/manager';
import { postManagerCancel } from '@test/support/manager-assignment';
import { placeOrders } from '@test/support/orders';
import { postPayment, USD_RATE } from '@test/support/payments';
import { resetServiceArea } from '@test/support/pricing';

const WEBHOOK_SECRET = 'whsec_swiftdrop_fake_stripe';
const TEST_SETTINGS: Record<string, string> = {
  [ENV_KEYS.STRIPE_SECRET_KEY]: 'sk_test_swiftdrop_fake_stripe',
  [ENV_KEYS.STRIPE_WEBHOOK_SECRET]: WEBHOOK_SECRET,
};
const PAYMENT_INTENT = 'pi_test_fake_stripe';
const CANCEL_BODY = { reason: 'Адрес доставки вне зоны' };

function paidEvent(orderId: number, sessionId: string): string {
  return JSON.stringify({
    id: 'evt_test_fake_stripe',
    object: 'event',
    type: STRIPE_EVENT.COMPLETED,
    data: {
      object: {
        id: sessionId,
        object: 'checkout.session',
        status: 'complete',
        payment_status: 'paid',
        payment_intent: PAYMENT_INTENT,
        metadata: { orderId: String(orderId) },
      },
    },
  });
}

describe('Payments through the fake Stripe client (e2e)', () => {
  let app: NestExpressApplication;
  let db: Database;
  let cookies: string;
  const getRoute = jest.fn();

  beforeAll(async () => {
    const config = { getOrThrow: (key: string) => TEST_SETTINGS[key] } as unknown as ConfigService;
    const gateway = new StripePaymentAdapter(new FakeStripeCheckoutClient(), config);

    app = await createTestApp([
      { token: OsrmService, useValue: { getRoute } },
      { token: NbrbService, useValue: { getUsdRate: () => Promise.resolve(USD_RATE) } },
      { token: PaymentGateway, useValue: gateway },
    ]);
    db = app.get<Database>(DRIZZLE);
  }, APP_HOOK_TIMEOUT_MS);

  beforeEach(async () => {
    await resetServiceArea(db, getRoute);
    ({ cookies } = await registerUser(app));
  }, APP_HOOK_TIMEOUT_MS);

  afterAll(async () => {
    await app.close();
  });

  async function startPayment(orderId: number): Promise<string> {
    const response = await postPayment(app, cookies, { orderId }).expect(HttpStatus.CREATED);

    return response.body.checkoutUrl;
  }

  function postSignedWebhook(body: string) {
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: body,
      secret: WEBHOOK_SECRET,
    });

    return rawPostApi(app, `${PAYMENTS_ROUTES.BASE}/${PAYMENTS_ROUTES.WEBHOOK}`)
      .set(CONTENT_TYPE_HEADER, JSON_CONTENT_TYPE)
      .set(WEBHOOK_SIGNATURE_HEADER, signature)
      .send(body);
  }

  it('should give every payment its own https page of a test session', async () => {
    const [firstOrderId, secondOrderId] = await placeOrders(app, cookies, 2);

    const first = await startPayment(firstOrderId);
    const second = await startPayment(secondOrderId);

    expect(first).toMatch(new RegExp(`^${FAKE_CHECKOUT_PAGE_URL}cs_test_\\w+$`));
    expect(second).not.toBe(first);
  });

  it('should close the first session and mark it failed when the order is paid again', async () => {
    const [orderId] = await placeOrders(app, cookies, 1);

    await startPayment(orderId);
    await startPayment(orderId);

    const rows = await db.select().from(payments).orderBy(asc(payments.paymentId));

    expect(rows.map((row) => row.status)).toEqual([PAYMENT_STATUS.FAILED, PAYMENT_STATUS.PENDING]);
  });

  it('should take a signed payment notification and refund the order on a cancel', async () => {
    const [orderId] = await placeOrders(app, cookies, 1);
    const sessionId = new URL(await startPayment(orderId)).pathname.split('/').pop() ?? '';
    const manager = await createManager(app, db);

    await postSignedWebhook(paidEvent(orderId, sessionId)).expect(HttpStatus.OK);
    const response = await postManagerCancel(app, manager, orderId, CANCEL_BODY).expect(
      HttpStatus.OK,
    );

    expect(response.body).toMatchObject({ refund: 'refunded' });
    expect((await db.select().from(payments))[0]).toMatchObject({
      status: PAYMENT_STATUS.REFUNDED,
      stripePaymentId: PAYMENT_INTENT,
    });
  });

  it('should refuse a notification signed with another secret', async () => {
    const body = paidEvent(1, 'cs_test_unknown');
    const signature = Stripe.webhooks.generateTestHeaderString({ payload: body, secret: 'other' });

    await rawPostApi(app, `${PAYMENTS_ROUTES.BASE}/${PAYMENTS_ROUTES.WEBHOOK}`)
      .set(CONTENT_TYPE_HEADER, JSON_CONTENT_TYPE)
      .set(WEBHOOK_SIGNATURE_HEADER, signature)
      .send(body)
      .expect(HttpStatus.BAD_REQUEST);
  });
});
