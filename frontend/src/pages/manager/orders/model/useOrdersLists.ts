import { useCallback } from 'react';
import type { ListParams } from '@/shared/lib/list-params';
import type { OrdersParams } from '../config/list-params';
import type { OrdersView } from './orders-view';
import { useOrdersFeed } from './useOrdersFeed';
import { useOrdersPage } from './useOrdersPage';

export function useOrdersLists(
  params: ListParams<OrdersParams>,
  view: OrdersView,
  isDesktop: boolean,
) {
  const { values, resetUntil } = params;
  const page = useOrdersPage({
    query: view.query,
    page: values.page,
    limit: values.limit,
    until: params.until,
    onUntil: params.setUntil,
    isEnabled: isDesktop,
  });
  const feed = useOrdersFeed({ query: view.query, limit: values.limit, isEnabled: !isDesktop });
  const reloadPage = page.reload;
  const reloadFeed = feed.reload;

  const reloadList = useCallback(() => {
    resetUntil();

    if (isDesktop) {
      reloadPage();
    } else {
      reloadFeed();
    }
  }, [resetUntil, isDesktop, reloadPage, reloadFeed]);

  return {
    page,
    feed,
    reloadList,
    isFirstPage: isDesktop ? values.page === 1 : !feed.hasExtraPages,
    items: isDesktop ? page.items : feed.items,
  };
}
