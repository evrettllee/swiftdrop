import { SORT_DIRECTION, SORT_VALUE_KIND } from '@/common/constants/list.constants';
import type { SortSpec } from '@/common/database/list-sort';
import { orders } from '@/database/schema';
import { HISTORY_SORT_KEY } from '../constants/deliveries.constants';

export type HistorySortKey = (typeof HISTORY_SORT_KEY)[keyof typeof HISTORY_SORT_KEY];

export const HISTORY_SORT: SortSpec<HistorySortKey> = {
  whitelist: {
    id: { column: orders.orderId, kind: SORT_VALUE_KIND.INTEGER },
    finishedAt: { column: orders.finishedAt, kind: SORT_VALUE_KIND.TIMESTAMP },
  },
  idColumn: orders.orderId,
  defaultSort: { key: HISTORY_SORT_KEY.ID, direction: SORT_DIRECTION.DESC },
};
