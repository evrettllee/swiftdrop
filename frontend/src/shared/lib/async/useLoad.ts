import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { ApiError, getApiErrorMessage, HTTP_STATUS } from '@/shared/api';

type Answer<T> = { key: string; data: T | null; message: string | null; isMissing: boolean };

export type Loaded<T> = {
  data: T | null;
  message: string | null;
  isMissing: boolean;
  isLoading: boolean;
  reload: () => void;
  replace: (data: T) => void;
};

export function useLoad<T>(
  key: string | null,
  load: (signal: AbortSignal) => Promise<T>,
  fallback: string,
): Loaded<T> {
  const [reloads, setReloads] = useState(0);
  const [answer, setAnswer] = useState<Answer<T> | null>(null);
  const runLoad = useEffectEvent(load);
  const fullKey = key === null ? null : `${key}#${reloads}`;

  useEffect(() => {
    if (key === null) {
      return undefined;
    }

    const controller = new AbortController();
    const answerKey = `${key}#${reloads}`;

    runLoad(controller.signal).then(
      (data) => setAnswer({ key: answerKey, data, message: null, isMissing: false }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => ({
            key: answerKey,
            data: previous?.key.startsWith(`${key}#`) === true ? previous.data : null,
            message: getApiErrorMessage(error, fallback),
            isMissing: error instanceof ApiError && error.status === HTTP_STATUS.NOT_FOUND,
          }));
        }
      },
    );

    return () => controller.abort();
  }, [key, reloads, fallback]);

  const reload = useCallback(() => setReloads((count) => count + 1), []);
  const replace = useCallback(
    (data: T) => {
      if (fullKey !== null) {
        setAnswer({ key: fullKey, data, message: null, isMissing: false });
      }
    },
    [fullKey],
  );
  const sameSubject = answer !== null && key !== null && answer.key.startsWith(`${key}#`);
  const isCurrent = answer !== null && answer.key === fullKey;

  return {
    data: sameSubject ? answer.data : null,
    message: isCurrent ? answer.message : null,
    isMissing: isCurrent && answer.isMissing,
    isLoading: key !== null && !isCurrent,
    reload,
    replace,
  };
}
