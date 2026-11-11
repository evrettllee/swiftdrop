import { useEffect, useState } from 'react';
import { countHistory, type HistoryQuery } from '../api/get-history';

const ALL_HISTORY: HistoryQuery = { q: null, from: null, to: null, sort: null, status: null };

export function useHistoryCount(query: HistoryQuery | null, delayMs = 0): number | null {
  const [answer, setAnswer] = useState<{ query: HistoryQuery; count: number } | null>(null);

  useEffect(() => {
    if (query === null) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      countHistory(query, controller.signal).then(
        (count) => {
          if (!controller.signal.aborted) {
            setAnswer({ query, count });
          }
        },
        () => undefined,
      );
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, delayMs]);

  return answer !== null && answer.query === query ? answer.count : null;
}

export function useWholeHistoryCount(): number | null {
  return useHistoryCount(ALL_HISTORY);
}
