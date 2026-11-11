import { SORT_DIRECTION, SORT_VALUE_KIND } from '@/common/constants/list.constants';
import type { SortSpec } from '@/common/database/list-sort';
import { orders } from '@/database/schema';
import { MANAGER_SORT_KEY } from '../constants/manager-orders.constants';

export type ManagerSortKey = (typeof MANAGER_SORT_KEY)[keyof typeof MANAGER_SORT_KEY];

export const MANAGER_ORDERS_SORT: SortSpec<ManagerSortKey> = {
  whitelist: {
    createdAt: { column: orders.createdAt, kind: SORT_VALUE_KIND.TIMESTAMP },
    price: { column: orders.price, kind: SORT_VALUE_KIND.DECIMAL },
    statusChangedAt: { column: orders.statusChangedAt, kind: SORT_VALUE_KIND.TIMESTAMP },
  },
  idColumn: orders.orderId,
  defaultSort: { key: MANAGER_SORT_KEY.CREATED_AT, direction: SORT_DIRECTION.DESC },
};
