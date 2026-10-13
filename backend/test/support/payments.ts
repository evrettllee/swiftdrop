import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import { payments } from '../../src/database/schema';
import type { Database } from '../../src/database/database.module';
import {
  CHECKOUT_SESSION_STATUS,
  PAYMENTS_ROUTES,
  SESSION_EXPIRE_RESULT,
  WEBHOOK_SIGNATURE_HEADER,
} from '../../src/modules/payments/constants/payments.constants';
import type { CheckoutSessionState } from '../../src/modules/payments/types/payments.types';
import { COOKIE_HEADER } from './auth';
import { CONTENT_TYPE_HEADER, JSON_CONTENT_TYPE } from './constants';
import { VALID_ORDER_PRICE_TEXT } from './fixtures';
import { postApi, rawPostApi } from './http';
import type { Cookies } from './orders';

export const WEBHOOK_SIGNATURE = 't=1,v1=test';
const WEBHOOK_BODY = '{"id":"evt_test"}';

// The call as the payment system makes it: no cookies and no CSRF header.
export function postWebhook(app: NestExpressApplication, signature?: string) {
  const webhookRequest = rawPostApi(app, `${PAYMENTS_ROUTES.BASE}/${PAYMENTS_ROUTES.WEBHOOK}`).set(
    CONTENT_TYPE_HEADER,
    JSON_CONTENT_TYPE,
  );

  if (signature) {
    webhookRequest.set(WEBHOOK_SIGNATURE_HEADER, signature);
  }

  return webhookRequest.send(WEBHOOK_BODY);
}

// BYN for one dollar, the price of VALID_ORDER at this rate is 304 cents.
export const USD_RATE = 3.0371;
export const VALID_ORDER_AMOUNT_USD = 3.04;
export const VALID_ORDER_AMOUNT_USD_TEXT = '3.04';

// The reference of a payment in the payment system.
export const PAYMENT_REF = 'pi_test_1';

export const CHECKOUT_SESSION = {
  sessionId: 'cs_test_1',
  url: 'https://checkout.stripe.test/pay/cs_test_1',
};

// A session nobody has paid yet, as the payment system reports it.
export const OPEN_SESSION_STATE: CheckoutSessionState = {
  status: CHECKOUT_SESSION_STATUS.OPEN,
  isPaid: false,
  paymentRef: null,
};

// A replacement of the payment system, the tests never call Stripe.
export function createGatewayMock() {
  return {
    createCheckoutSession: jest.fn(),
    expireCheckoutSession: jest.fn(),
    getCheckoutSession: jest.fn(),
    refund: jest.fn(),
    parseWebhook: jest.fn(),
  };
}

export function resetGatewayMock(gateway: ReturnType<typeof createGatewayMock>): void {
  Object.values(gateway).forEach((method) => method.mockReset());
  gateway.createCheckoutSession.mockResolvedValue(CHECKOUT_SESSION);
  gateway.expireCheckoutSession.mockResolvedValue(SESSION_EXPIRE_RESULT.EXPIRED);
  gateway.getCheckoutSession.mockResolvedValue(OPEN_SESSION_STATE);
  gateway.refund.mockResolvedValue(undefined);
}

export function postPayment(
  app: NestExpressApplication,
  cookies: Cookies,
  body: Record<string, unknown>,
) {
  return postApi(app, PAYMENTS_ROUTES.BASE).set(COOKIE_HEADER, cookies).send(body);
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
      amount: VALID_ORDER_PRICE_TEXT,
      amountUsd: VALID_ORDER_AMOUNT_USD_TEXT,
      exchangeRate: USD_RATE,
      checkoutSessionId: `cs_test_inserted_${sessionCounter}`,
      ...overrides,
    })
    .returning({ paymentId: payments.paymentId });

  return payment.paymentId;
}

export async function readPaymentStatus(db: Database, paymentId: number): Promise<string> {
  const [payment] = await db
    .select({ status: payments.status })
    .from(payments)
    .where(eq(payments.paymentId, paymentId));

  return payment.status;
}
