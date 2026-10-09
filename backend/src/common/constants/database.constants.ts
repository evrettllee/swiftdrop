export const PG_UNIQUE_VIOLATION_CODE = '23505';
// lock_not_available: the lock was not taken within lock_timeout.
export const PG_LOCK_NOT_AVAILABLE_CODE = '55P03';
export const SINGLE_ROW_LIMIT = 1;

// The partial unique index of the open payment attempt of an order.
export const PAYMENTS_ONE_PENDING_PER_ORDER_INDEX = 'payments_one_pending_per_order_uidx';
