import type { PAYMENT_EVENT, PAYMENT_RETURN_RESULT } from './payments.constants';

export type CheckoutSessionInput = {
  orderId: number;
  // The amount in the smallest unit of the currency, for dollars it is cents.
  amountMinor: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
};

export type CheckoutSession = {
  sessionId: string;
  // The page of the payment system where the client enters the card.
  url: string;
};

type PaymentEventBase = {
  orderId: number;
  sessionId: string;
};

export type PaidEvent = PaymentEventBase & {
  type: typeof PAYMENT_EVENT.PAID;
  // The reference of the payment, it is needed for a refund.
  paymentRef: string;
};

export type ExpiredEvent = PaymentEventBase & {
  type: typeof PAYMENT_EVENT.EXPIRED;
};

export type PaymentEvent = PaidEvent | ExpiredEvent;

export type PaymentReturnResult =
  (typeof PAYMENT_RETURN_RESULT)[keyof typeof PAYMENT_RETURN_RESULT];

export type StartedPayment = {
  paymentId: number;
  // Where the client goes to pay.
  checkoutUrl: string;
};
