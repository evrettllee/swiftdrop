import type Stripe from 'stripe';
import { PAYMENT_EVENT } from '../../payments/payments.constants';
import { mapStripeEvent } from './stripe-event.mapper';
import { STRIPE_EVENT } from './stripe.constants';

function buildEvent(type: string, session: Record<string, unknown>): Stripe.Event {
  return { type, data: { object: session } } as unknown as Stripe.Event;
}

const PAID_SESSION = {
  id: 'cs_test_1',
  payment_status: 'paid',
  payment_intent: 'pi_test_1',
  metadata: { orderId: '42' },
};

describe('mapStripeEvent', () => {
  it('should return a paid event with the payment reference when a session is completed and paid', () => {
    expect(mapStripeEvent(buildEvent(STRIPE_EVENT.COMPLETED, PAID_SESSION))).toEqual({
      type: PAYMENT_EVENT.PAID,
      orderId: 42,
      sessionId: 'cs_test_1',
      paymentRef: 'pi_test_1',
    });
  });

  it('should return null when a session is completed but still unpaid', () => {
    const session = { ...PAID_SESSION, payment_status: 'unpaid' };

    expect(mapStripeEvent(buildEvent(STRIPE_EVENT.COMPLETED, session))).toBeNull();
  });

  it('should return a paid event when a delayed payment succeeds', () => {
    const event = mapStripeEvent(buildEvent(STRIPE_EVENT.ASYNC_SUCCEEDED, PAID_SESSION));

    expect(event?.type).toBe(PAYMENT_EVENT.PAID);
  });

  it('should return an expired event when a session expires', () => {
    expect(mapStripeEvent(buildEvent(STRIPE_EVENT.EXPIRED, PAID_SESSION))).toEqual({
      type: PAYMENT_EVENT.EXPIRED,
      orderId: 42,
      sessionId: 'cs_test_1',
    });
  });

  it('should return null when the session has no valid order id in its metadata', () => {
    const session = { ...PAID_SESSION, metadata: { orderId: 'abc' } };

    expect(mapStripeEvent(buildEvent(STRIPE_EVENT.COMPLETED, session))).toBeNull();
  });

  it('should return null when the event type is not needed', () => {
    expect(mapStripeEvent(buildEvent('charge.refunded', PAID_SESSION))).toBeNull();
  });
});
