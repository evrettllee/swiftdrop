import { getApiErrorMessage, type OrderListItem } from '@/shared/api';
import { useCursorFeed } from '@/shared/lib/list-feed';
import { getOrdersCursorPage, type OrdersCursorPage, type OrdersQuery } from '../api/list-orders';
import { ORDERS_TEXTS } from '../config/texts';

function messageOf(error: unknown): string {
  return getApiErrorMessage(error, ORDERS_TEXTS.LIST_FAILED);
}

type OrdersFeedOptions = { query: OrdersQuery; isEnabled: boolean };

export function useOrdersFeed({ query, isEnabled }: OrdersFeedOptions) {
  return useCursorFeed<OrderListItem, OrdersCursorPage>({
    key: JSON.stringify(query),
    isEnabled,
    load: (cursor, signal) => getOrdersCursorPage(query, cursor, signal),
    messageOf,
  });
}
