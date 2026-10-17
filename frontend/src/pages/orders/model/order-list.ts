import type { OrderListItem } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { type LOAD_MODE, type ORDER_LIST_FILTER, ORDERS_FIRST_PAGE } from '../config/list';

export type OrderListFilter = (typeof ORDER_LIST_FILTER)[keyof typeof ORDER_LIST_FILTER];

export type LoadMode = (typeof LOAD_MODE)[keyof typeof LOAD_MODE];

export type OrdersListState = {
  status: ListStatus;
  items: OrderListItem[];
  page: number;
  total: number;
  message: string | null;
};

export const ORDERS_LIST_INITIAL_STATE: OrdersListState = {
  status: LIST_STATUS.LOADING,
  items: [],
  page: ORDERS_FIRST_PAGE,
  total: 0,
  message: null,
};

// What the list should show; `attempt` grows on "retry", so the same page is requested again.
export type ListRequest = {
  filter: OrderListFilter;
  page: number;
  mode: LoadMode;
  attempt: number;
};

// The last answer remembers the request it belongs to.
export type StoredListAnswer = OrdersListState & { filter: OrderListFilter | null; key: string };
