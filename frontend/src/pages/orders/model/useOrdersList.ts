import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '@/shared/api';
import { LIST_STATUS } from '@/shared/config';
import { listOrders } from '../api/list-orders';
import { LOAD_MODE, ORDERS_FIRST_PAGE, ORDERS_PAGE_SIZE } from '../config/list';
import { ORDERS_TEXTS } from '../config/texts';
import type { LoadMode, OrderListFilter, OrdersListState } from './order-list';

const INITIAL_STATE: OrdersListState = {
  status: LIST_STATUS.LOADING,
  items: [],
  page: ORDERS_FIRST_PAGE,
  total: 0,
  message: null,
};

// What the list should show; `attempt` grows on "retry", so the same page is requested again.
type ListRequest = { filter: OrderListFilter; page: number; mode: LoadMode; attempt: number };

// The last answer remembers the request it belongs to.
type StoredAnswer = OrdersListState & { filter: OrderListFilter | null; key: string };

function firstRequest(filter: OrderListFilter): ListRequest {
  return { filter, page: ORDERS_FIRST_PAGE, mode: LOAD_MODE.RESET, attempt: 0 };
}

function requestKey({ filter, page, mode, attempt }: ListRequest): string {
  return `${filter}:${page}:${mode}:${attempt}`;
}

// The orders of the client for a filter. The desktop moves between pages (`goToPage`), a phone
// adds the next page to the end of the list (`showMore`). Clicks change only the request, the
// effect loads it, and "loading" means the stored answer belongs to another request.
export function useOrdersList(filter: OrderListFilter) {
  const [request, setRequest] = useState<ListRequest>(() => firstRequest(filter));
  const [answer, setAnswer] = useState<StoredAnswer>({ ...INITIAL_STATE, filter: null, key: '' });

  // A new filter starts its list from the first page.
  const current = request.filter === filter ? request : firstRequest(filter);
  const currentKey = requestKey(current);
  const { page, mode, attempt } = current;

  useEffect(() => {
    let isCurrent = true;
    const key = requestKey({ filter, page, mode, attempt });

    async function load(): Promise<void> {
      try {
        const result = await listOrders(page, filter);

        if (isCurrent) {
          setAnswer((previous) => ({
            filter,
            key,
            status: LIST_STATUS.READY,
            items:
              mode === LOAD_MODE.APPEND && previous.filter === filter
                ? [...previous.items, ...result.items]
                : result.items,
            page: result.page,
            total: result.total,
            message: null,
          }));
        }
      } catch (error) {
        if (isCurrent) {
          setAnswer((previous) => {
            // A failed next page keeps the loaded cards; a failed first page shows the empty error.
            const isSameList = mode !== LOAD_MODE.RESET && previous.filter === filter;

            return {
              ...(isSameList ? previous : INITIAL_STATE),
              filter,
              key,
              status: LIST_STATUS.ERROR,
              message: getApiErrorMessage(error, ORDERS_TEXTS.LIST_FAILED),
            };
          });
        }
      }
    }

    void load();

    return () => {
      isCurrent = false;
    };
  }, [filter, page, mode, attempt]);

  let state: OrdersListState = INITIAL_STATE;

  if (answer.filter === filter) {
    const isAnswered = answer.key === currentKey;

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
