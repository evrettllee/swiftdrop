import type { CheckoutSession, CheckoutSessionInput, PaymentEvent } from '../payments.types';

// The contract of a payment system. Other code depends on it, not on Stripe,
// so the system can be replaced and mocked in tests.
export abstract class PaymentGateway {
  abstract createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSession>;

  // Closes an unpaid session, so a cancelled or timed out order can no longer be paid.
  abstract expireCheckoutSession(sessionId: string): Promise<void>;

  abstract refund(paymentRef: string): Promise<void>;

  // Checks the signature of a notification and converts it to a PaymentEvent.
  // Throws when the signature is wrong, returns null for notifications that are not needed.
  abstract parseWebhook(rawBody: Buffer, signature: string): PaymentEvent | null;
}
