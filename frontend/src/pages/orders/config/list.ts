export const ORDER_STATUS_GROUP = {
  ACTIVE: 'active',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatusGroup = (typeof ORDER_STATUS_GROUP)[keyof typeof ORDER_STATUS_GROUP];

export const ORDERS_TAB = {
  ...ORDER_STATUS_GROUP,
  ALL: 'all',
} as const;

export type OrdersTab = (typeof ORDERS_TAB)[keyof typeof ORDERS_TAB];

export const ORDERS_TABS: readonly OrdersTab[] = [
  ORDERS_TAB.ACTIVE,
  ORDERS_TAB.FINISHED,
  ORDERS_TAB.CANCELLED,
  ORDERS_TAB.ALL,
];

export const ORDERS_SORT = {
  NEWEST: 'createdAt:desc',
  OLDEST: 'createdAt:asc',
  PRICE_HIGH: 'price:desc',
  PRICE_LOW: 'price:asc',
} as const;

export type OrdersSort = (typeof ORDERS_SORT)[keyof typeof ORDERS_SORT];

export const ORDERS_SORTS: readonly OrdersSort[] = [
  ORDERS_SORT.NEWEST,
  ORDERS_SORT.OLDEST,
  ORDERS_SORT.PRICE_HIGH,
  ORDERS_SORT.PRICE_LOW,
];

export const ORDERS_TABS_ID_PREFIX = 'orders-tab';
export const ORDERS_FIRST_PAGE = 1;
export const ORDERS_PAGE_MAX = 10_000;
export const ORDERS_SEARCH_MAX_LENGTH = 100;
export const ORDERS_CURSOR_FIRST = '';
export const ORDER_COUNT_PROBE_LIMIT = 1;
export const COUNTS_DRAFT_DELAY_MS = 300;

export const LEGACY_FILTER_PARAM = 'filter';
export const STATUS_PARAM = 'status';

export const LEGACY_FILTER_STATUS: Readonly<Record<string, OrderStatusGroup | null>> = {
  all: null,
  active: ORDER_STATUS_GROUP.ACTIVE,
  finished: ORDER_STATUS_GROUP.FINISHED,
};
