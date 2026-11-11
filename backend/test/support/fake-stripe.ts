import { randomUUID } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeCheckoutApi } from '@/integrations/stripe/contracts/stripe-checkout.contract';
import type {
  StripeSessionLink,
  StripeSessionState,
} from '@/integrations/stripe/types/stripe.types';

export const FAKE_CHECKOUT_PAGE_URL = 'https://checkout.stripe.com/c/pay/';
const SESSION_ID_PREFIX = 'cs_test_';
const MISSING_RESOURCE_CODE = 'resource_missing';

function stripeRequestError(statusCode: HttpStatus, message: string): Stripe.errors.StripeError {
  return new Stripe.errors.StripeInvalidRequestError({
    type: 'invalid_request_error',
    statusCode,
    message,
    ...(statusCode === HttpStatus.NOT_FOUND ? { code: MISSING_RESOURCE_CODE } : {}),
  });
}

export class FakeStripeCheckoutClient extends StripeCheckoutApi {
  private readonly sessions = new Map<string, StripeSessionState>();
  private readonly refundKeys = new Set<string>();

  createSession(): Promise<StripeSessionLink> {
    const id = `${SESSION_ID_PREFIX}${randomUUID().replaceAll('-', '')}`;

    this.sessions.set(id, { status: 'open', payment_status: 'unpaid', payment_intent: null });

    return Promise.resolve({ id, url: `${FAKE_CHECKOUT_PAGE_URL}${id}` });
  }

  expireSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session === undefined) {
      return Promise.reject(this.missing(sessionId));
    }

    if (session.status !== 'open') {
      return Promise.reject(
        stripeRequestError(HttpStatus.BAD_REQUEST, `Session ${sessionId} is not open`),
      );
    }

    this.sessions.set(sessionId, { ...session, status: 'expired' });

    return Promise.resolve();
  }

  retrieveSession(sessionId: string): Promise<StripeSessionState> {
    const session = this.sessions.get(sessionId);

    return session === undefined
      ? Promise.reject(this.missing(sessionId))
      : Promise.resolve({ ...session });
  }

  createRefund(_paymentIntent: string, idempotencyKey: string): Promise<void> {
    this.refundKeys.add(idempotencyKey);

    return Promise.resolve();
  }

  private missing(sessionId: string): Stripe.errors.StripeError {
    return stripeRequestError(HttpStatus.NOT_FOUND, `No such checkout.session: ${sessionId}`);
  }
}
