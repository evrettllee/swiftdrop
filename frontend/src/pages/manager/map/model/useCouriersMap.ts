import { useCallback, useEffect, useState } from 'react';
import { SOCKET_EVENTS, type TypedSocketEvent, useSocketEventBatch } from '@/shared/realtime';
import { type CouriersMap, type CouriersMapQuery, getCouriersMap } from '@/shared/staff-api';

const LIVE_EVENTS: readonly TypedSocketEvent[] = [
  SOCKET_EVENTS.STAFF_COURIER,
  SOCKET_EVENTS.STAFF_ORDER,
];

export type MapAnswer = {
  query: CouriersMapQuery;
  attempt: number;
  data: CouriersMap | null;
  receivedAt: number;
  isFailed: boolean;
};

export function useCouriersMap(query: CouriersMapQuery) {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<MapAnswer | null>(null);
  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    getCouriersMap(query, controller.signal).then(
      (data) => setAnswer({ query, attempt, data, receivedAt: Date.now(), isFailed: false }),
      () => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => ({
            query,
            attempt,
            data: previous?.data ?? null,
            receivedAt: previous?.receivedAt ?? Date.now(),
            isFailed: true,
          }));
        }
      },
    );

    return () => controller.abort();
  }, [query, attempt]);

  useSocketEventBatch(LIVE_EVENTS, reload);

  return {
    answer,
    isLoading: answer === null || answer.query !== query || answer.attempt !== attempt,
    reload,
  };
}
