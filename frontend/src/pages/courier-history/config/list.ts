export const HISTORY_FIRST_PAGE = 1;
export const HISTORY_PAGE_MAX = 10_000;
export const HISTORY_COUNT_PROBE_LIMIT = 1;
export const HISTORY_COUNT_DELAY_MS = 300;
export const HISTORY_SEARCH_MAX_LENGTH = 10;
export const HISTORY_SEARCH_PATTERN = /^\d{1,10}$/;

export const HISTORY_SORT = {
  NEWEST: 'finishedAt:desc',
  OLDEST: 'finishedAt:asc',
  FARTHEST: 'distanceKm:desc',
  NEAREST: 'distanceKm:asc',
} as const;

export type HistorySort = (typeof HISTORY_SORT)[keyof typeof HISTORY_SORT];

export const HISTORY_SORTS: readonly HistorySort[] = [
  HISTORY_SORT.NEWEST,
  HISTORY_SORT.OLDEST,
  HISTORY_SORT.FARTHEST,
  HISTORY_SORT.NEAREST,
];
