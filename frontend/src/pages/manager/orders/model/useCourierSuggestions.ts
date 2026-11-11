import { useEffect, useState } from 'react';
import { type CourierLookupItem, lookupCouriers } from '@/shared/staff-api';
import { LIST_SEARCH_DEBOUNCE_MS } from '@/shared/lib/list-params';
import { isSearchUsable } from '@/shared/staff-api';

export const SUGGESTIONS_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

type SuggestionsStatus = (typeof SUGGESTIONS_STATUS)[keyof typeof SUGGESTIONS_STATUS];

type SuggestionsAnswer = {
  query: string;
  status: SuggestionsStatus;
  items: CourierLookupItem[];
};

export function useCourierSuggestions(text: string) {
  const query = text.trim();
  const isUsable = isSearchUsable(query);
  const [answer, setAnswer] = useState<SuggestionsAnswer | null>(null);

  useEffect(() => {
    if (!isUsable) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      lookupCouriers(query, controller.signal).then(
        (items) => setAnswer({ query, status: SUGGESTIONS_STATUS.READY, items }),
        () => {
          if (!controller.signal.aborted) {
            setAnswer({ query, status: SUGGESTIONS_STATUS.ERROR, items: [] });
          }
        },
      );
    }, LIST_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, isUsable]);

  if (!isUsable) {
    return { status: SUGGESTIONS_STATUS.IDLE, items: [] };
  }

  return answer !== null && answer.query === query
    ? { status: answer.status, items: answer.items }
    : { status: SUGGESTIONS_STATUS.LOADING, items: [] };
}
