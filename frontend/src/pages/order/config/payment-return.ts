// After the payment page the client comes back with ?payment=success or ?payment=cancelled
// (must match PAYMENT_RETURN_PARAM and PAYMENT_RETURN_RESULT of the backend).
export const PAYMENT_RETURN_PARAM = 'payment';

export const PAYMENT_RETURN = {
  SUCCESS: 'success',
  CANCELLED: 'cancelled',
} as const;

// The webhook comes a moment after the browser: the order is asked again until it is paid.
export const PAYMENT_CHECK_INTERVAL_MS = 2000;
export const PAYMENT_CHECK_ATTEMPTS = 10;

// An unpaid order is cancelled after this time (matches UNPAID_ORDER_TTL_MINUTES of the backend).
export const UNPAID_ORDER_TTL_MINUTES = 30;
