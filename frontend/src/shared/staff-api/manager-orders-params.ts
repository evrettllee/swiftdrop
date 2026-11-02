export const MANAGER_ORDERS_PARAM = {
  PAGE: 'page',
  LIMIT: 'limit',
  UNTIL: 'until',
  CURSOR: 'cursor',
  SORT: 'sort',
  STATUS: 'status',
  FROM: 'from',
  TO: 'to',
  COURIER_ID: 'courierId',
  PAYMENT: 'payment',
  FRAGILE: 'fragile',
  SEARCH: 'q',
  FORMAT: 'format',
  WITH_PHONES: 'withPhones',
} as const;

export const MANAGER_STATUS_GROUP = {
  ATTENTION: 'attention',
  ACTIVE: 'active',
  AWAITING_PAYMENT: 'awaiting_payment',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
} as const;

export type ManagerStatusGroup = (typeof MANAGER_STATUS_GROUP)[keyof typeof MANAGER_STATUS_GROUP];

export const PAYMENT_STATE = {
  PAID: 'paid',
  REFUNDED: 'refunded',
  UNPAID: 'unpaid',
} as const;

export type PaymentState = (typeof PAYMENT_STATE)[keyof typeof PAYMENT_STATE];

export const MANAGER_ORDERS_SORT = {
  NEWEST: 'createdAt:desc',
  OLDEST: 'createdAt:asc',
  PRICE_HIGH: 'price:desc',
  PRICE_LOW: 'price:asc',
  LONGEST_WAITING: 'statusChangedAt:asc',
} as const;

export type ManagerOrdersSort = (typeof MANAGER_ORDERS_SORT)[keyof typeof MANAGER_ORDERS_SORT];

export const EXPORT_FORMAT = {
  XLSX: 'xlsx',
  CSV: 'csv',
} as const;

export type ExportFormat = (typeof EXPORT_FORMAT)[keyof typeof EXPORT_FORMAT];

export const MANAGER_FLAG_TRUE = 'true';
export const LIST_VALUES_SEPARATOR = ',';
export const MANAGER_SEARCH_TEXT_MIN_LENGTH = 3;
export const MANAGER_SEARCH_MAX_LENGTH = 100;
export const MANAGER_ORDERS_LIMIT_MAX = 100;
export const LIST_CURSOR_FIRST = '';
export const EXPORT_TOO_LARGE_CODE = 'EXPORT_TOO_LARGE';
