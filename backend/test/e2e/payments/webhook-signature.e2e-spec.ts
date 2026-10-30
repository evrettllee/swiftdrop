import { HttpStatus } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import Stripe from 'stripe';
import { ENV_KEYS } from '@/config/env.constants';
import { StripePaymentAdapter } from '@/integrations/stripe/adapters/stripe-payment.adapter';
import { PaymentGateway } from '@/modules/payments/contracts/payment-gateway.contract';
import {
  PAYMENTS_ROUTES,
  WEBHOOK_SIGNATURE_HEADER,
} from '@/modules/payments/constants/payments.constants';
import { createTestApp } from '@test/support/app';
import { CONTENT_TYPE_HEADER, JSON_CONTENT_TYPE } from '@test/support/constants';
import { rawPostApi } from '@test/support/http';

const WEBHOOK_SECRET = 'whsec_swiftdrop_e2e_only';
const TEST_SETTINGS: Record<string, string> = {
  [ENV_KEYS.STRIPE_SECRET_KEY]: 'sk_test_swiftdrop_e2e_only',
  [ENV_KEYS.STRIPE_WEBHOOK_SECRET]: WEBHOOK_SECRET,
};
const PAYLOAD =
  '{ "id": "evt_swiftdrop",  "object": "event", "type": "customer.created",\n  "data": { "object": { "note": "Доставка" } } }';

describe('Payment webhook signature over the raw body (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const config = { getOrThrow: (key: string) => TEST_SETTINGS[key] } as unknown as ConfigService;

    app = await createTestApp([
      { token: PaymentGateway, useValue: new StripePaymentAdapter(config) },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  function postSigned(body: string, signedPayload: string) {
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload: signedPayload,
      secret: WEBHOOK_SECRET,
    });

    return rawPostApi(app, `${PAYMENTS_ROUTES.BASE}/${PAYMENTS_ROUTES.WEBHOOK}`)
      .set(CONTENT_TYPE_HEADER, JSON_CONTENT_TYPE)
      .set(WEBHOOK_SIGNATURE_HEADER, signature)
      .send(body);
  }

  it('should accept the body signed byte for byte, spaces and Cyrillic included', async () => {
    await postSigned(PAYLOAD, PAYLOAD).expect(HttpStatus.OK);
  });

  it('should refuse the same signature over a body that differs only in spaces', async () => {
    const compact = JSON.stringify(JSON.parse(PAYLOAD));

    await postSigned(compact, PAYLOAD).expect(HttpStatus.BAD_REQUEST);
  });
});
