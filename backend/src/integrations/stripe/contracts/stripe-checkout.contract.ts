import type Stripe from 'stripe';
import type { StripeSessionLink, StripeSessionState } from '../types/stripe.types';

export abstract class StripeCheckoutApi {
  abstract createSession(params: Stripe.Checkout.SessionCreateParams): Promise<StripeSessionLink>;

  abstract expireSession(sessionId: string): Promise<void>;

  abstract retrieveSession(sessionId: string): Promise<StripeSessionState>;

  abstract createRefund(paymentIntent: string, idempotencyKey: string): Promise<void>;
}
