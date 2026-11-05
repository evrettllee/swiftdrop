import { getApiErrorMessage, type OrderListItem } from '@/shared/api';
import { usePagedList } from '@/shared/lib/list-feed';
import { getOrdersPage, type OrdersPage, type OrdersQuery } from '../api/list-orders';
import { ORDERS_PAGE_SIZE } from '../config/list';
import { ORDERS_TEXTS } from '../config/texts';

function messageOf(error: unknown): string {
  return getApiErrorMessage(error, ORDERS_TEXTS.LIST_FAILED);
}

type OrdersPageOptions = {
  query: OrdersQuery;
  page: number;
  until: number | null;
  onUntil: (until: number | null) => void;
  isEnabled: boolean;
};

export function useOrdersPage({ query, page, until, onUntil, isEnabled }: OrdersPageOptions) {
  return usePagedList<OrderListItem, OrdersPage>({
    key: JSON.stringify(query),
    page,
    pageSize: ORDERS_PAGE_SIZE,
    until,
    onUntil,
    isEnabled,
    load: (pageNumber, bound, signal) => getOrdersPage(query, pageNumber, signal, { until: bound }),
    messageOf,
  });
}
