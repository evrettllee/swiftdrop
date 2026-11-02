import { useCallback, useMemo } from 'react';
import { listParamsKey, useListParams } from '@/shared/lib/list-params';
import { ORDERS_PARAMS_CONFIG } from '../config/list-params';
import { toOrdersView } from './orders-view';
import { useCourierName } from './useCourierName';
import { useLiveOrders } from './useLiveOrders';
import { useOrdersLists } from './useOrdersLists';
import { useTabCounts } from './useTabCounts';

export function useManagerOrders(isDesktop: boolean) {
  const params = useListParams(ORDERS_PARAMS_CONFIG);
  const { values, update, resetUntil } = params;
  const view = useMemo(() => toOrdersView(values), [values]);
  const lists = useOrdersLists(params, view, isDesktop);
  const counts = useTabCounts(view.filter);
  const courier = useCourierName(view.filter.courierId, lists.items);
  const { reloadList } = lists;

  const live = useLiveOrders({
    tab: view.tab,
    listKey: listParamsKey(values, ORDERS_PARAMS_CONFIG),
    isAuto: !view.hasFilters && view.filter.search === null && lists.isFirstPage,
    onListChange: reloadList,
    onCountsChange: counts.reload,
  });
  const { clearNew } = live;

  const showNew = useCallback(() => {
    clearNew();

    if (isDesktop && values.page !== 1) {
      resetUntil();
      update({ page: 1 });
    } else {
      reloadList();
    }
  }, [clearNew, isDesktop, values.page, resetUntil, update, reloadList]);

  return {
    params,
    view,
    page: lists.page,
    feed: lists.feed,
    counts: counts.counts,
    newCount: live.newCount,
    showNew,
    changeParams: update,
    courierName: courier.courierName,
    rememberCourier: courier.rememberCourier,
  };
}
