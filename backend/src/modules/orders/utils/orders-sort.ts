import { SORT_DIRECTION, SORT_VALUE_KIND } from '@/common/constants/list.constants';
import type { SortSpec } from '@/common/database/list-sort';
import { orders } from '@/database/schema';
import { ORDERS_SORT_KEY } from '../constants/orders.constants';

export type OrdersSortKey = (typeof ORDERS_SORT_KEY)[keyof typeof ORDERS_SORT_KEY];

export const ORDERS_SORT: SortSpec<OrdersSortKey> = {
  whitelist: {
    createdAt: { column: orders.createdAt, kind: SORT_VALUE_KIND.TIMESTAMP },
    price: { column: orders.price, kind: SORT_VALUE_KIND.DECIMAL },
  },
  idColumn: orders.orderId,
  defaultSort: { key: ORDERS_SORT_KEY.CREATED_AT, direction: SORT_DIRECTION.DESC },
};
