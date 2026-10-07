import type { NestExpressApplication } from '@nestjs/platform-express';
import { payments } from '../../src/db/schema';
import type { Database } from '../../src/database/database.module';
import { PAYMENTS_ROUTES } from '../../src/payments/payments.constants';
import { postApi, nextClientIp } from './http';
import type { Cookies } from './orders';
import request from 'supertest';
import { GLOBAL_PREFIX } from '../../src/common/constants/http';
import { WEBHOOK_SIGNATURE_HEADER } from '../../src/payments/payments.constants';
import { CLIENT_IP_HEADER } from './constants';

export const WEBHOOK_SIGNATURE = 't=1,v1=test';
const WEBHOOK_BODY = '{"id":"evt_test"}';

// The call as the payment system makes it: no cookies and no CSRF header.
export function postWebhook(app: NestExpressApplication, signature?: string) {
  const webhookRequest = request(app.getHttpServer())
    .post(`/${GLOBAL_PREFIX}/${PAYMENTS_ROUTES.BASE}/${PAYMENTS_ROUTES.WEBHOOK}`)
    .set(CLIENT_IP_HEADER, nextClientIp())
    .set('Content-Type', 'application/json');

  if (signature) {
    webhookRequest.set(WEBHOOK_SIGNATURE_HEADER, signature);
  }

  return webhookRequest.send(WEBHOOK_BODY);
}

// BYN for one dollar, 9.23 BYN at this rate is 304 cents.
export const USD_RATE = 3.0371;

export const CHECKOUT_SESSION = {
  sessionId: 'cs_test_1',
  url: 'https://checkout.stripe.test/pay/cs_test_1',
};

// A replacement of the payment system, the tests never call Stripe.
export function createGatewayMock() {
  return {
    createCheckoutSession: jest.fn(),
    expireCheckoutSession: jest.fn(),
    refund: jest.fn(),
    parseWebhook: jest.fn(),
  };
}

export function resetGatewayMock(gateway: ReturnType<typeof createGatewayMock>): void {
  Object.values(gateway).forEach((method) => method.mockReset());
  gateway.createCheckoutSession.mockResolvedValue(CHECKOUT_SESSION);
  gateway.expireCheckoutSession.mockResolvedValue(undefined);
  gateway.refund.mockResolvedValue(undefined);
}

export function postPayment(
  app: NestExpressApplication,
  cookies: Cookies,
  body: Record<string, unknown>,
) {
  return postApi(app, PAYMENTS_ROUTES.BASE).set('Cookie', cookies).send(body);
}

let sessionCounter = 0;

// Puts a payment of an order into the database as if it was made, the fields can be overridden.
export async function insertPayment(
  db: Database,
  orderId: number,
  overrides: Partial<typeof payments.$inferInsert> = {},
): Promise<number> {
  sessionCounter += 1;

  const [payment] = await db
    .insert(payments)
    .values({
      orderId,
      amount: '9.23',
      amountUsd: '3.04',
      exchangeRate: USD_RATE,
      checkoutSessionId: `cs_test_inserted_${sessionCounter}`,
      ...overrides,
    })
    .returning({ paymentId: payments.paymentId });

  return payment.paymentId;
}
