// Must match the filters and the limits of GET /api/orders.
export const ORDER_LIST_FILTER = {
  ALL: 'all',
  ACTIVE: 'active',
  FINISHED: 'finished',
} as const;

export const ORDER_LIST_FILTERS = [
  ORDER_LIST_FILTER.ALL,
  ORDER_LIST_FILTER.ACTIVE,
  ORDER_LIST_FILTER.FINISHED,
] as const;

// Prefix of the ids that link the filter tabs and their panels.
export const ORDERS_TABS_ID_PREFIX = 'orders-filter';

export const ORDERS_FIRST_PAGE = 1;
export const ORDERS_PAGE_SIZE = 5;

// The counters of the tabs need only `total`, so one order per request is enough.
export const ORDER_COUNT_PROBE_LIMIT = 1;

// How a loaded page joins the list: a new filter starts the list over, the pagination of the
// desktop replaces the page, the button "show more" of a phone adds to the end.
export const LOAD_MODE = {
  RESET: 'reset',
  REPLACE: 'replace',
  APPEND: 'append',
} as const;
