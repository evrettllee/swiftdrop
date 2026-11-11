import { getApiErrorMessage, type OrderListItem } from '@/shared/api';
import { createFeedCache, useCursorFeed } from '@/shared/lib/list-feed';
import { getOrdersCursorPage, type OrdersCursorPage, type OrdersQuery } from '../api/list-orders';
import { ORDERS_TEXTS } from '../config/texts';

const ORDERS_FEED_CACHE = createFeedCache<OrderListItem, OrdersCursorPage>();

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
    cache: ORDERS_FEED_CACHE,
  });
}
