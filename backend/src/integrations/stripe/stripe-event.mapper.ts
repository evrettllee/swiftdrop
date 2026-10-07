import type Stripe from 'stripe';
import { PAYMENT_EVENT } from '../../payments/payments.constants';
import type { ExpiredEvent, PaidEvent, PaymentEvent } from '../../payments/payments.types';
import {
  STRIPE_EVENT,
  STRIPE_METADATA_ORDER_ID_KEY,
  STRIPE_PAYMENT_STATUS_PAID,
} from './stripe.constants';

function readOrderId(session: Stripe.Checkout.Session): number | null {
  const orderId = Number(session.metadata?.[STRIPE_METADATA_ORDER_ID_KEY]);

  return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
}

function readPaymentRef(session: Stripe.Checkout.Session): string | null {
  const paymentIntent = session.payment_intent;

  return typeof paymentIntent === 'string' ? paymentIntent : (paymentIntent?.id ?? null);
}

function toPaidEvent(session: Stripe.Checkout.Session): PaidEvent | null {
  const orderId = readOrderId(session);
  const paymentRef = readPaymentRef(session);
  let event: PaidEvent | null = null;

  // A session completed with an unpaid status waits for a delayed payment method.
  if (session.payment_status === STRIPE_PAYMENT_STATUS_PAID && orderId !== null && paymentRef) {
    event = { type: PAYMENT_EVENT.PAID, orderId, sessionId: session.id, paymentRef };
  }

  return event;
}

function toExpiredEvent(session: Stripe.Checkout.Session): ExpiredEvent | null {
  const orderId = readOrderId(session);
  let event: ExpiredEvent | null = null;

  if (orderId !== null) {
    event = { type: PAYMENT_EVENT.EXPIRED, orderId, sessionId: session.id };
  }

  return event;
}

// Converts a Stripe notification to ours, notifications that are not needed give null.
export function mapStripeEvent(event: Stripe.Event): PaymentEvent | null {
  let result: PaymentEvent | null = null;

  switch (event.type) {
    case STRIPE_EVENT.COMPLETED:
    case STRIPE_EVENT.ASYNC_SUCCEEDED:
      result = toPaidEvent(event.data.object);
      break;
    case STRIPE_EVENT.EXPIRED:
      result = toExpiredEvent(event.data.object);
      break;
    default:
      break;
  }

  return result;
}
