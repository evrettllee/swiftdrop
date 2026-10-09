export const LIST_STATUS = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

export type ListStatus = (typeof LIST_STATUS)[keyof typeof LIST_STATUS];
