import { useCallback, useEffect, useState } from 'react';
import { isTooManyRequests } from '@/shared/analytics-api';
import { getApiErrorMessage } from '@/shared/api';
import { PERIOD_DEBOUNCE_MS } from '../config/analytics';
import { MANAGER_ANALYTICS_TEXTS } from '../config/texts';

type Keyed<Q> = { key: string; query: Q };

type Answer<T> = { key: string; attempt: number; data: T | null; failure: string | null };

export type AnalyticsRequest<T> = {
  data: T | null;
  failure: string | null;
  isLoading: boolean;
  retry: () => void;
};

function failureOf(error: unknown, fallback: string): string {
  return isTooManyRequests(error)
    ? MANAGER_ANALYTICS_TEXTS.TOO_MANY
    : getApiErrorMessage(error, fallback);
}

function useDebouncedRequest<Q>(request: Keyed<Q> | null): Keyed<Q> | null {
  const [settled, setSettled] = useState(request);

  useEffect(() => {
    if (request === null || request.key === settled?.key) {
      return undefined;
    }

    const timer = window.setTimeout(() => setSettled(request), PERIOD_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [request, settled]);

  return settled;
}

export function useAnalyticsRequest<Q, T>(
  request: Keyed<Q> | null,
  load: (query: Q, signal: AbortSignal) => Promise<T>,
  fallback: string,
): AnalyticsRequest<T> {
  const settled = useDebouncedRequest(request);
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<Answer<T> | null>(null);
  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    if (settled === null) {
      return undefined;
    }

    const controller = new AbortController();
    const done = (data: T | null, failure: string | null) =>
      setAnswer({ key: settled.key, attempt, data, failure });

    load(settled.query, controller.signal).then(
      (data) => done(data, null),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          done(null, failureOf(error, fallback));
        }
      },
    );

    return () => controller.abort();
  }, [settled, attempt, load, fallback]);

  const key = request?.key ?? null;
  const isCurrent = answer !== null && answer.attempt === attempt && answer.key === key;
  const shown = key === null ? answer : isCurrent ? answer : null;

  return {
    data: shown?.data ?? null,
    failure: shown?.failure ?? null,
    isLoading: key !== null && !isCurrent,
    retry,
  };
}
