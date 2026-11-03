import { type OrderStatus } from '@/shared/api';
import {
  isSearchUsable,
  type ManagerOrdersFilter,
  type ManagerOrdersListQuery,
  type ManagerOrdersSort,
} from '@/shared/staff-api';
import {
  defaultTabSort,
  ORDERS_TAB,
  type OrdersTab,
  TAB_STATUS_GROUP,
  TAB_STATUSES,
  tabSorts,
} from '../config/list';
import type { OrdersParams } from '../config/list-params';
import { isPeriodValid } from '../lib/period';

export type OrdersView = {
  tab: OrdersTab;
  sort: ManagerOrdersSort;
  sorts: readonly ManagerOrdersSort[];
  filter: ManagerOrdersFilter;
  query: ManagerOrdersListQuery;
  filtersCount: number;
  hasFilters: boolean;
};

export function tabOf(params: Pick<OrdersParams, 'status'>): OrdersTab {
  return params.status ?? ORDERS_TAB.ALL;
}

export function filterOf(params: OrdersParams): ManagerOrdersFilter {
  const period = isPeriodValid(params) ? params : { from: null, to: null };

  return {
    from: period.from,
    to: period.to,
    courierId: params.courierId,
    payment: params.payment,
    fragile: params.fragile,
    search: params.q !== null && isSearchUsable(params.q) ? params.q : null,
  };
}

export function countFilters(filter: ManagerOrdersFilter): number {
  return [
    filter.from !== null || filter.to !== null,
    filter.courierId !== null,
    filter.payment.length > 0,
    filter.fragile,
  ].filter(Boolean).length;
}

export function toOrdersView(params: OrdersParams): OrdersView {
  const tab = tabOf(params);
  const sorts = tabSorts(tab);
  const sort =
    params.sort !== null && sorts.includes(params.sort) ? params.sort : defaultTabSort(tab);
  const filter = filterOf(params);
  const filtersCount = countFilters(filter);

  return {
    tab,
    sort,
    sorts,
    filter,
    query: { ...filter, status: TAB_STATUS_GROUP[tab], sort },
    filtersCount,
    hasFilters: filtersCount > 0,
  };
}

export function sortParamOf(tab: OrdersTab, sort: ManagerOrdersSort): ManagerOrdersSort | null {
  return sort === defaultTabSort(tab) ? null : sort;
}

export function isInTab(tab: OrdersTab, status: OrderStatus): boolean {
  const statuses = TAB_STATUSES[tab];

  return statuses === null || statuses.includes(status);
}

export const FILTERS_RESET: Pick<
  OrdersParams,
  'from' | 'to' | 'courierId' | 'payment' | 'fragile'
> = { from: null, to: null, courierId: null, payment: [], fragile: false };
