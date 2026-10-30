export const PG_UNIQUE_VIOLATION_CODE = '23505';
// lock_not_available: the lock was not taken within lock_timeout.
export const PG_LOCK_NOT_AVAILABLE_CODE = '55P03';
export const SINGLE_ROW_LIMIT = 1;
// FOR NO KEY UPDATE: the row is locked for changes, rows that only refer to it are not blocked.
export const ROW_LOCK_NO_KEY_UPDATE = 'no key update';
// FOR SHARE: the row cannot change until the commit, other readers that share it are not blocked.
export const ROW_LOCK_SHARE = 'share';
// The largest value of an integer column: a bigger id cannot exist and must not reach a query.
export const DB_INTEGER_MAX = 2_147_483_647;

// The partial unique index of the open payment attempt of an order.
export const PAYMENTS_ONE_PENDING_PER_ORDER_INDEX = 'payments_one_pending_per_order_uidx';
// The partial unique index that keeps one active order per courier.
export const ORDERS_ONE_ACTIVE_PER_COURIER_INDEX = 'orders_one_active_per_courier_uidx';
export const SERVICE_ZONES_NAME_INDEX = 'service_zones_name_lower_uidx';
