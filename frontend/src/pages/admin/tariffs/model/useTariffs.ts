import { useCallback, useEffect, useState } from 'react';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { type AdminTariff, getTariffs } from '../api/admin-tariffs';

type Answer = { attempt: number; status: ListStatus; items: AdminTariff[] };

export function useTariffs() {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getTariffs(controller.signal).then(
      (items) => setAnswer({ attempt, status: LIST_STATUS.READY, items }),
      () => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => ({
            attempt,
            status: LIST_STATUS.ERROR,
            items: previous?.items ?? [],
          }));
        }
      },
    );

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);
  const replace = useCallback(
    (tariff: AdminTariff) =>
      setAnswer((previous) => ({
        attempt: previous?.attempt ?? 0,
        status: LIST_STATUS.READY,
        items: (previous?.items ?? []).map((item) =>
          item.tariffId === tariff.tariffId ? tariff : item,
        ),
      })),
    [],
  );
  const prepend = useCallback(
    (tariff: AdminTariff) =>
      setAnswer((previous) => ({
        attempt: previous?.attempt ?? 0,
        status: LIST_STATUS.READY,
        items: [tariff, ...(previous?.items ?? [])],
      })),
    [],
  );
  const isCurrent = answer !== null && answer.attempt === attempt;
  const status = isCurrent ? answer.status : LIST_STATUS.LOADING;

  return { status, items: answer?.items ?? [], retry, replace, prepend };
}
