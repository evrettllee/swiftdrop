import type { CourierHistoryItem } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import type { HistoryPage } from '../api/get-history';
import {
  HISTORY_FIRST_PAGE,
  HISTORY_PAGE_SIZE,
  HISTORY_PAGE_SIZE_MAX,
  LOAD_MODE,
} from '../config/list';

export type LoadMode = (typeof LOAD_MODE)[keyof typeof LOAD_MODE];

// What the list should show: `page` is the page of the desktop, on a phone the number of pages
// shown. `attempt` grows on "retry", so the same page is requested again.
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

export const NO_ANSWER: HistoryAnswer = {
  key: '',
  status: LIST_STATUS.LOADING,
  items: [],
  page: HISTORY_FIRST_PAGE,
  total: 0,
};

// The first request of a page that is opened or reopened (from the address). A phone gets all the
// pages up to it in one request, as long as the backend allows so many; otherwise the page alone.
export function openRequest(page: number, isDesktop: boolean): HistoryRequest {
  const isRestorable =
    !isDesktop && page > HISTORY_FIRST_PAGE && page * HISTORY_PAGE_SIZE <= HISTORY_PAGE_SIZE_MAX;

  return { page, mode: isRestorable ? LOAD_MODE.RESTORE : LOAD_MODE.REPLACE, attempt: 0 };
}

// The page and the size of the backend request of this one.
export function toQuery({ page, mode }: HistoryRequest): { page: number; limit: number } {
  return mode === LOAD_MODE.RESTORE
    ? { page: HISTORY_FIRST_PAGE, limit: page * HISTORY_PAGE_SIZE }
    : { page, limit: HISTORY_PAGE_SIZE };
}

export function requestKey({ page, mode, attempt }: HistoryRequest): string {
  return `${page}:${mode}:${attempt}`;
}

export function getTotalPages(total: number): number {
  return Math.max(HISTORY_FIRST_PAGE, Math.ceil(total / HISTORY_PAGE_SIZE));
}

// "Show more" adds the page to the cards; any other mode shows what came alone.
export function toReadyAnswer(
  previous: HistoryAnswer,
  request: HistoryRequest,
  result: HistoryPage,
): HistoryAnswer {
  return {
    key: requestKey(request),
    status: LIST_STATUS.READY,
    items: request.mode === LOAD_MODE.APPEND ? [...previous.items, ...result.items] : result.items,
    page: request.mode === LOAD_MODE.RESTORE ? request.page : result.page,
    total: result.total,
  };
}

// A failed page keeps the cards the list shows.
export function toFailedAnswer(previous: HistoryAnswer, request: HistoryRequest): HistoryAnswer {
  return { ...previous, key: requestKey(request), status: LIST_STATUS.ERROR };
}
