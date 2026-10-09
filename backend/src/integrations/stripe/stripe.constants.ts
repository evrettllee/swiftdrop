import { MS_PER_SECOND } from '../../common/constants/time.constants';

export const STRIPE_REQUEST_TIMEOUT_MS = 10 * MS_PER_SECOND;

export const STRIPE_CHECKOUT_MODE = 'payment';

// The key of the order id in the metadata of a Stripe session.
export const STRIPE_METADATA_ORDER_ID_KEY = 'orderId';

export const STRIPE_EVENT = {
  COMPLETED: 'checkout.session.completed',
  ASYNC_SUCCEEDED: 'checkout.session.async_payment_succeeded',
  EXPIRED: 'checkout.session.expired',
} as const;

export const STRIPE_PAYMENT_STATUS_PAID = 'paid';

export const SINGLE_ITEM_QUANTITY = 1;

// A payment is refunded once: with the same key Stripe returns the first result instead of a second refund.
export const STRIPE_REFUND_IDEMPOTENCY_PREFIX = 'refund-';
