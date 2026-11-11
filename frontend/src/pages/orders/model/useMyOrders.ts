import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { DESKTOP_MEDIA_QUERY, LIST_STATUS } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { useListParams } from '@/shared/lib/list-params';
import type { OrdersQuery } from '../api/list-orders';
import { ORDERS_TAB, type OrdersTab } from '../config/list';
import { ORDERS_PARAMS_CONFIG, type OrdersParams } from '../config/list-params';
import { withoutLegacyFilter } from '../lib/legacy-filter';
import { useOrderCounts } from './useOrderCounts';
import { useOrdersFeed } from './useOrdersFeed';
import { useOrdersPage } from './useOrdersPage';

function useLegacyFilter(): boolean {
  const [searchParams, setSearchParams] = useSearchParams();
  const converted = useMemo(() => withoutLegacyFilter(searchParams), [searchParams]);

  useEffect(() => {
    if (converted !== null) {
      setSearchParams(converted, { replace: true });
    }
  }, [converted, setSearchParams]);

  return converted !== null;
}

export function useMyOrders() {
  const isLegacy = useLegacyFilter();
  const params = useListParams<OrdersParams>(ORDERS_PARAMS_CONFIG);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const { status, q, from, to, sort, page } = params.values;
  const query = useMemo<OrdersQuery>(
    () => ({ status, q, from, to, sort }),
    [status, q, from, to, sort],
  );
  const pages = useOrdersPage({
    query,
    page,
    until: params.until,
    onUntil: params.setUntil,
    isEnabled: isDesktop && !isLegacy,
  });
  const feed = useOrdersFeed({ query, isEnabled: !isDesktop && !isLegacy });
  const counts = useOrderCounts(query);
  const tab: OrdersTab = status ?? ORDERS_TAB.ALL;
  const list = isDesktop ? pages : feed;
  const isEmpty = list.status === LIST_STATUS.READY && list.items.length === 0;

  return { params, isDesktop, query, tab, pages, feed, counts, isEmpty };
}

export type MyOrders = ReturnType<typeof useMyOrders>;
