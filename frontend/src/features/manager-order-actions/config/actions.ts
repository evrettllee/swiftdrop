export const ORDER_ACTION = {
  ASSIGN: 'assign',
  REASSIGN: 'reassign',
  RESTART: 'restart',
  CANCEL: 'cancel',
} as const;

export type OrderAction = (typeof ORDER_ACTION)[keyof typeof ORDER_ACTION];

export const CANDIDATE_SEARCH_DEBOUNCE_MS = 300;

export const VEHICLE_FILTER_ALL = 'all';
