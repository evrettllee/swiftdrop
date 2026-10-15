import { getApiErrorMessage, type OrderListItem } from '@/shared/api';
import { LIST_STATUS } from '@/shared/config';
import { LOAD_MODE, ORDERS_FIRST_PAGE } from '../config/list';
import { ORDERS_TEXTS } from '../config/texts';
import {
  type ListRequest,
  type OrderListFilter,
  ORDERS_LIST_INITIAL_STATE,
  type StoredListAnswer,
} from '../model/order-list';

type LoadedPage = { items: OrderListItem[]; page: number; total: number };

export function firstRequest(filter: OrderListFilter): ListRequest {
  return { filter, page: ORDERS_FIRST_PAGE, mode: LOAD_MODE.RESET, attempt: 0 };
}

export function requestKey({ filter, page, mode, attempt }: ListRequest): string {
  return `${filter}:${page}:${mode}:${attempt}`;
}

// "Show more" adds the page to the cards of the same filter; any other mode shows the page alone.
export function toReadyListAnswer(
  previous: StoredListAnswer,
  request: ListRequest,
  result: LoadedPage,
): StoredListAnswer {
  const isAppended = request.mode === LOAD_MODE.APPEND && previous.filter === request.filter;

  return {
    filter: request.filter,
    key: requestKey(request),
    status: LIST_STATUS.READY,
    items: isAppended ? [...previous.items, ...result.items] : result.items,
    page: result.page,
    total: result.total,
    message: null,
  };
}

// A failed next page keeps the loaded cards; a failed first page shows the empty error.
export function toFailedListAnswer(
  previous: StoredListAnswer,
  request: ListRequest,
  error: unknown,
): StoredListAnswer {
  const isSameList = request.mode !== LOAD_MODE.RESET && previous.filter === request.filter;

  return {
    ...(isSameList ? previous : ORDERS_LIST_INITIAL_STATE),
    filter: request.filter,
    key: requestKey(request),
    status: LIST_STATUS.ERROR,
    message: getApiErrorMessage(error, ORDERS_TEXTS.LIST_FAILED),
  };
}
