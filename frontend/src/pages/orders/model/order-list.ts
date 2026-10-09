import type { OrderListItem } from '@/shared/api';
import type { ListStatus } from '@/shared/config';
import type { LOAD_MODE, ORDER_LIST_FILTER } from '../config/list';

export type OrderListFilter = (typeof ORDER_LIST_FILTER)[keyof typeof ORDER_LIST_FILTER];

export type LoadMode = (typeof LOAD_MODE)[keyof typeof LOAD_MODE];

export type OrdersListState = {
  status: ListStatus;
  items: OrderListItem[];
  page: number;
  total: number;
  message: string | null;
};
