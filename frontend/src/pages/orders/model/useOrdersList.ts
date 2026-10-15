import { useState } from 'react';
import { LIST_STATUS } from '@/shared/config';
import { LOAD_MODE, ORDERS_PAGE_SIZE } from '../config/list';
import { firstRequest, requestKey } from '../lib/orders-list';
import {
  type ListRequest,
  type OrderListFilter,
  ORDERS_LIST_INITIAL_STATE,
  type OrdersListState,
} from './order-list';
import { useOrdersListAnswer } from './useOrdersListAnswer';

// The orders of the client for a filter. The desktop moves between pages (`goToPage`), a phone
// adds the next page to the end of the list (`showMore`). Clicks change only the request, the
// effect loads it, and "loading" means the stored answer belongs to another request.
export function useOrdersList(filter: OrderListFilter) {
  const [request, setRequest] = useState<ListRequest>(() => firstRequest(filter));

  // A new filter starts its list from the first page.
  const current = request.filter === filter ? request : firstRequest(filter);
  const answer = useOrdersListAnswer(current);
  let state: OrdersListState = ORDERS_LIST_INITIAL_STATE;

  if (answer.filter === filter) {
    const isAnswered = answer.key === requestKey(current);

    state = {
      status: isAnswered ? answer.status : LIST_STATUS.LOADING,
      items: answer.items,
      page: answer.page,
      total: answer.total,
      message: isAnswered ? answer.message : null,
    };
  }

  function goToPage(nextPage: number): void {
    setRequest({ filter, page: nextPage, mode: LOAD_MODE.REPLACE, attempt: 0 });
  }

  function showMore(): void {
    setRequest({ filter, page: state.page + 1, mode: LOAD_MODE.APPEND, attempt: 0 });
  }

  function retry(): void {
    setRequest({ ...current, attempt: current.attempt + 1 });
  }

  return {
    ...state,
    totalPages: Math.ceil(state.total / ORDERS_PAGE_SIZE),
    hasMore: state.items.length < state.total,
    goToPage,
    showMore,
    retry,
  };
}
