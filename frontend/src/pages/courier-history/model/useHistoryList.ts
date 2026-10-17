import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { LIST_STATUS } from '@/shared/config';
import { matchesMediaQuery } from '@/shared/lib/dom';
import { HISTORY_PAGE_PARAM, parseHistoryPage } from '@/shared/routes';
import { HISTORY_DESKTOP_QUERY, HISTORY_FIRST_PAGE, LOAD_MODE } from '../config/list';
import { getTotalPages, type HistoryRequest, openRequest, requestKey } from './history-list';
import { useHistoryAnswer } from './useHistoryAnswer';

// The first page has no parameter in the address.
function toParamValue(page: number): string | null {
  return page > HISTORY_FIRST_PAGE ? String(page) : null;
}

function openPage(page: number): HistoryRequest {
  return openRequest(page, matchesMediaQuery(HISTORY_DESKTOP_QUERY));
}

// The history of the courier. The desktop moves between pages (`goToPage`), a phone adds the next
// page to the end (`showMore`). Clicks change only the request; the effect loads it, and the
// address follows it (?page=N, replacing the entry, so the Back button of the browser does not
// stick). A page opened from the address is loaded as it says; one that is not a page of the
// history is the first page, and the address is corrected. "Loading" means the stored answer
// belongs to another request.
export function useHistoryList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = searchParams.get(HISTORY_PAGE_PARAM);
  const urlPage = parseHistoryPage(rawPage);
  const [request, setRequest] = useState<HistoryRequest>(() => openPage(urlPage));
  const [seenUrlPage, setSeenUrlPage] = useState(urlPage);
  const answer = useHistoryAnswer(request);
  const isAnswered = answer.key === requestKey(request);
  const isPastEnd =
    isAnswered && answer.status === LIST_STATUS.READY && request.page > getTotalPages(answer.total);

  // The address changed by someone else (the menu, Back) is a new request; a change that followed
  // the request already has its page.
  if (urlPage !== seenUrlPage) {
    setSeenUrlPage(urlPage);

    if (urlPage !== request.page) {
      setRequest(openPage(urlPage));
    }
  }

  // A page past the end is the first page.
  if (isPastEnd) {
    setRequest(openPage(HISTORY_FIRST_PAGE));
  }

  useEffect(() => {
    const value = toParamValue(request.page);

    if (rawPage !== value) {
      setSearchParams(value === null ? {} : { [HISTORY_PAGE_PARAM]: value }, { replace: true });
    }
  }, [request.page, rawPage, setSearchParams]);

  return {
    status: isAnswered ? answer.status : LIST_STATUS.LOADING,
    items: answer.items,
    page: answer.page,
    total: answer.total,
    totalPages: getTotalPages(answer.total),
    hasMore: answer.items.length < answer.total,
    goToPage: (page: number) => setRequest({ page, mode: LOAD_MODE.REPLACE, attempt: 0 }),
    showMore: () => setRequest({ page: answer.page + 1, mode: LOAD_MODE.APPEND, attempt: 0 }),
    retry: () => setRequest((current) => ({ ...current, attempt: current.attempt + 1 })),
  };
}

export type HistoryList = ReturnType<typeof useHistoryList>;
