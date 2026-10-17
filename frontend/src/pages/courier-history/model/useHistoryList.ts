import { useEffect, useState } from 'react';
import { LIST_STATUS } from '@/shared/config';
import { getHistory } from '../api/get-history';
import { HISTORY_PAGE_SIZE, LOAD_MODE } from '../config/list';
import {
  FIRST_REQUEST,
  type HistoryAnswer,
  type HistoryRequest,
  NO_ANSWER,
  requestKey,
  toFailedAnswer,
  toReadyAnswer,
} from './history-list';

// The history of the courier. The desktop moves between pages (`goToPage`), a phone adds the next
// page to the end (`showMore`). Clicks change only the request, the effect loads it; a request
// that is not needed any more (another page, the page left) is cancelled, so an old answer never
// replaces a new one. "Loading" means the stored answer belongs to another request.
export function useHistoryList() {
  const [request, setRequest] = useState<HistoryRequest>(FIRST_REQUEST);
  const [answer, setAnswer] = useState<HistoryAnswer>(NO_ANSWER);
  const { page, mode, attempt } = request;

  useEffect(() => {
    const controller = new AbortController();
    const current: HistoryRequest = { page, mode, attempt };

    getHistory({ page }, controller.signal).then(
      (result) => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => toReadyAnswer(previous, current, result));
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => toFailedAnswer(previous, current));
        }
      },
    );

    return () => controller.abort();
  }, [page, mode, attempt]);

  const isAnswered = answer.key === requestKey(request);

  return {
    status: isAnswered ? answer.status : LIST_STATUS.LOADING,
    items: answer.items,
    page: answer.page,
    total: answer.total,
    totalPages: Math.ceil(answer.total / HISTORY_PAGE_SIZE),
    hasMore: answer.items.length < answer.total,
    goToPage: (next: number) => setRequest({ page: next, mode: LOAD_MODE.REPLACE, attempt: 0 }),
    showMore: () => setRequest({ page: answer.page + 1, mode: LOAD_MODE.APPEND, attempt: 0 }),
    retry: () => setRequest((current) => ({ ...current, attempt: current.attempt + 1 })),
  };
}

export type HistoryList = ReturnType<typeof useHistoryList>;
