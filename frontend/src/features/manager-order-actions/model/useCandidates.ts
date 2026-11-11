import { useCallback, useEffect, useRef, useState } from 'react';
import {
  onTypedSocketEvent,
  SOCKET_EVENTS,
  type TypedSocketEvent,
  useSocketEventBatch,
} from '@/shared/realtime';
import {
  CANDIDATE_SORT,
  type CandidateSort,
  type CourierCandidates,
  getCourierCandidates,
  isSearchUsable,
} from '@/shared/staff-api';
import { CANDIDATE_SEARCH_DEBOUNCE_MS } from '../config/actions';

const LIVE_EVENTS: readonly TypedSocketEvent[] = [
  SOCKET_EVENTS.STAFF_ORDER,
  SOCKET_EVENTS.STAFF_COURIER,
];

export type CandidatesAnswer = {
  query: string;
  attempt: number;
  data: CourierCandidates | null;
  isFailed: boolean;
};

function useDebounced(value: string): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), CANDIDATE_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [value]);

  return debounced;
}

function useLiveReload(orderId: number, isEnabled: boolean, reload: () => void): void {
  const isChanged = useRef(false);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const stopOrder = onTypedSocketEvent(SOCKET_EVENTS.STAFF_ORDER, (payload) => {
      isChanged.current ||= payload.orderId === orderId;
    });
    const stopCourier = onTypedSocketEvent(SOCKET_EVENTS.STAFF_COURIER, () => {
      isChanged.current = true;
    });

    return () => {
      stopOrder();
      stopCourier();
    };
  }, [orderId, isEnabled]);

  useSocketEventBatch(LIVE_EVENTS, () => {
    if (isChanged.current) {
      isChanged.current = false;
      reload();
    }
  });
}

export function useCandidates(orderId: number, isEnabled: boolean) {
  const [searchText, setSearchText] = useState('');
  const [sort, setSort] = useState<CandidateSort>(CANDIDATE_SORT.PICKUP_DISTANCE);
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<CandidatesAnswer | null>(null);
  const debounced = useDebounced(searchText);
  const search = isSearchUsable(debounced) ? debounced.trim() : null;
  const query = `${orderId}:${sort}:${search ?? ''}`;
  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    const controller = new AbortController();

    getCourierCandidates(orderId, { search, sort }, controller.signal).then(
      (data) => setAnswer({ query, attempt, data, isFailed: false }),
      () => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => ({
            query,
            attempt,
            data: previous?.data ?? null,
            isFailed: true,
          }));
        }
      },
    );

    return () => controller.abort();
  }, [orderId, isEnabled, search, sort, query, attempt]);

  useLiveReload(orderId, isEnabled, reload);

  return {
    searchText,
    setSearchText,
    sort,
    setSort,
    answer,
    isLoading: answer === null || answer.query !== query || answer.attempt !== attempt,
    reload,
  };
}
