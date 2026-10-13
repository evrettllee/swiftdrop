import type {
  CheckoutSession,
  CheckoutSessionInput,
  CheckoutSessionState,
  PaymentEvent,
  SessionExpireResult,
} from '../types/payments.types';

// The contract of a payment system. Other code depends on it, not on Stripe,
// so the system can be replaced and mocked in tests.
export abstract class PaymentGateway {
  abstract createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession>;

  // Closes an unpaid session, so a cancelled or timed out order can no longer be paid.
  // A session that is no longer open is an answer, not a failure; a failure throws.
  abstract expireCheckoutSession(sessionId: string): Promise<SessionExpireResult>;

  abstract getCheckoutSession(sessionId: string): Promise<CheckoutSessionState>;

  abstract refund(paymentRef: string): Promise<void>;

  // Checks the signature of a notification and converts it to a PaymentEvent.
  // Throws when the signature is wrong, returns null for notifications that are not needed.
  abstract parseWebhook(rawBody: Buffer, signature: string): PaymentEvent | null;
}
