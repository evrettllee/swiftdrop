import type { CourierHistoryItem } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import type { HistoryPage } from '../api/get-history';
import { HISTORY_FIRST_PAGE, LOAD_MODE } from '../config/list';

export type LoadMode = (typeof LOAD_MODE)[keyof typeof LOAD_MODE];

// What the list should show; `attempt` grows on "retry", so the same page is requested again.
export type HistoryRequest = {
  page: number;
  mode: LoadMode;
  attempt: number;
};

// The last answer, with the key of the request it belongs to.
export type HistoryAnswer = {
  key: string;
  status: ListStatus;
  items: CourierHistoryItem[];
  page: number;
  total: number;
};

export const FIRST_REQUEST: HistoryRequest = {
  page: HISTORY_FIRST_PAGE,
  mode: LOAD_MODE.REPLACE,
  attempt: 0,
};

export const NO_ANSWER: HistoryAnswer = {
  key: '',
  status: LIST_STATUS.LOADING,
  items: [],
  page: HISTORY_FIRST_PAGE,
  total: 0,
};

export function requestKey({ page, mode, attempt }: HistoryRequest): string {
  return `${page}:${mode}:${attempt}`;
}

// "Show more" adds the page to the cards; the pagination shows the page alone. The cards already
// shown keep their objects, so they do not render again.
export function toReadyAnswer(
  previous: HistoryAnswer,
  request: HistoryRequest,
  result: HistoryPage,
): HistoryAnswer {
  return {
    key: requestKey(request),
    status: LIST_STATUS.READY,
    items: request.mode === LOAD_MODE.APPEND ? [...previous.items, ...result.items] : result.items,
    page: result.page,
    total: result.total,
  };
}

// A failed page keeps the cards the list shows.
export function toFailedAnswer(previous: HistoryAnswer, request: HistoryRequest): HistoryAnswer {
  return { ...previous, key: requestKey(request), status: LIST_STATUS.ERROR };
}
