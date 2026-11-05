import { LIST_STATUS } from '@/shared/config';
import { ORDERS_TAB } from '../config/list';
import type { OrdersParams } from '../config/list-params';
import type { RowAction } from '../lib/row-actions';
import { type OrdersView, sortParamOf } from '../model/orders-view';
import type { useOrdersFeed } from '../model/useOrdersFeed';
import type { useOrdersPage } from '../model/useOrdersPage';
import { OrdersFeed } from './OrdersFeed';
import { OrdersEmpty, OrdersFailed, OrdersListSkeleton } from './OrdersListState';
import { OrdersTable } from './OrdersTable';

type OrdersContentProps = {
  isDesktop: boolean;
  view: OrdersView;
  values: OrdersParams;
  page: ReturnType<typeof useOrdersPage>;
  feed: ReturnType<typeof useOrdersFeed>;
  now: number;
  emptyText: string;
  onChange: (patch: Partial<OrdersParams>) => void;
  onAction: RowAction;
};

export function OrdersContent({
  isDesktop,
  view,
  values,
  page,
  feed,
  now,
  emptyText,
  onChange,
  onAction,
}: OrdersContentProps) {
  const list = isDesktop ? page : feed;

  if (list.items.length === 0 && list.status === LIST_STATUS.LOADING) {
    return <OrdersListSkeleton />;
  }

  if (list.items.length === 0 && list.status === LIST_STATUS.ERROR) {
    return <OrdersFailed message={list.message} onRetry={list.reload} />;
  }

  if (list.items.length === 0) {
    return (
      <OrdersEmpty isFiltered={view.hasFilters || view.filter.search !== null} text={emptyText} />
    );
  }

  return isDesktop ? (
    <OrdersTable
      tab={view.tab}
      sort={view.sort}
      sorts={view.sorts}
      items={page.items}
      now={now}
      page={values.page}
      totalPages={page.totalPages}
      total={page.total}
      limit={values.limit}
      isBusy={page.status === LIST_STATUS.LOADING}
      onPage={(next) => onChange({ page: next })}
      onLimit={(limit) => onChange({ limit })}
      onAction={onAction}
      onSort={(sort) => onChange({ sort: sortParamOf(view.tab, sort) })}
    />
  ) : (
    <OrdersFeed
      feed={feed}
      now={now}
      isAttention={view.tab === ORDERS_TAB.ATTENTION}
      onAction={onAction}
    />
  );
}
