import { MANAGER_ORDERS_SORT, type ManagerOrdersSort } from '@/shared/staff-api';

export const SORT_COLUMN = {
  ORDER: 'order',
  SUM: 'sum',
  WAITING: 'waiting',
} as const;

export type SortColumn = (typeof SORT_COLUMN)[keyof typeof SORT_COLUMN];

export const COLUMN_OF_SORT: Record<ManagerOrdersSort, SortColumn> = {
  [MANAGER_ORDERS_SORT.NEWEST]: SORT_COLUMN.ORDER,
  [MANAGER_ORDERS_SORT.OLDEST]: SORT_COLUMN.ORDER,
  [MANAGER_ORDERS_SORT.PRICE_HIGH]: SORT_COLUMN.SUM,
  [MANAGER_ORDERS_SORT.PRICE_LOW]: SORT_COLUMN.SUM,
  [MANAGER_ORDERS_SORT.LONGEST_WAITING]: SORT_COLUMN.WAITING,
};

export const ASCENDING_SORTS: ReadonlySet<ManagerOrdersSort> = new Set([
  MANAGER_ORDERS_SORT.OLDEST,
  MANAGER_ORDERS_SORT.PRICE_LOW,
]);
