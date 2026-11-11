import type Stripe from 'stripe';

export type StripeSessionLink = Pick<Stripe.Checkout.Session, 'id' | 'url'>;

export type StripeSessionState = Pick<
  Stripe.Checkout.Session,
  'status' | 'payment_status' | 'payment_intent'
>;
