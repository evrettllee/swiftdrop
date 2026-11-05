export const SORT_KEY = {
  CREATED_AT: 'createdAt',
  PRICE: 'price',
  STATUS_CHANGED_AT: 'statusChangedAt',
} as const;

export type SortableKey = typeof SORT_KEY.CREATED_AT | typeof SORT_KEY.PRICE;
