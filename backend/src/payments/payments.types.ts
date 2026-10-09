import type {
  CHECKOUT_SESSION_STATUS,
  PAYMENT_EVENT,
  PAYMENT_RETURN_RESULT,
  PENDING_PAYMENT_OUTCOME,
  SESSION_EXPIRE_RESULT,
} from './payments.constants';

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

export type SessionExpireResult = (typeof SESSION_EXPIRE_RESULT)[keyof typeof SESSION_EXPIRE_RESULT];

export type CheckoutSessionStatus =
  (typeof CHECKOUT_SESSION_STATUS)[keyof typeof CHECKOUT_SESSION_STATUS];

// A session as the payment system sees it now.
export type CheckoutSessionState = {
  status: CheckoutSessionStatus;
  isPaid: boolean;
  // The reference of the payment, it is known once the session is paid.
  paymentRef: string | null;
};

export type PendingPaymentOutcome =
  (typeof PENDING_PAYMENT_OUTCOME)[keyof typeof PENDING_PAYMENT_OUTCOME];

// The result of reconciling the pending payments of cancelled orders.
export type ReconciliationSummary = {
  orderCount: number;
  // Orders whose payments could not be settled, for example because a refund failed.
  failedOrderCount: number;
  outcomes: Record<PendingPaymentOutcome, number>;
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
