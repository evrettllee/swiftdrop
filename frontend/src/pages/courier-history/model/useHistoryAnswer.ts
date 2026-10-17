import { useEffect, useState } from 'react';
import { getHistory } from '../api/get-history';
import {
  type HistoryAnswer,
  type HistoryRequest,
  NO_ANSWER,
  toFailedAnswer,
  toQuery,
  toReadyAnswer,
} from './history-list';

// Loads the request and keeps the last answer. A request that is not needed any more (another
// page, the page left) is cancelled, so an old answer never replaces a new one.
export function useHistoryAnswer({ page, mode, attempt }: HistoryRequest): HistoryAnswer {
  const [answer, setAnswer] = useState<HistoryAnswer>(NO_ANSWER);

  useEffect(() => {
    const controller = new AbortController();
    const request: HistoryRequest = { page, mode, attempt };

    getHistory(toQuery(request), controller.signal).then(
      (result) => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => toReadyAnswer(previous, request, result));
        }
      },
      () => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => toFailedAnswer(previous, request));
        }
      },
    );

    return () => controller.abort();
  }, [page, mode, attempt]);

  return answer;
}
