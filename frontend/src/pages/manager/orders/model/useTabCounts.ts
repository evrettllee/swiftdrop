import { useCallback, useEffect, useState } from 'react';
import {
  getManagerOrderCounts,
  type ManagerOrderCounts,
  type ManagerOrdersFilter,
  orderCountsStore,
} from '@/shared/staff-api';

type CountsAnswer = {
  key: string;
  counts: ManagerOrderCounts;
};

export function useTabCounts(filter: ManagerOrdersFilter, delayMs = 0, isShared = false) {
  const [reloads, setReloads] = useState(0);
  const [answer, setAnswer] = useState<CountsAnswer | null>(null);
  const filterKey = JSON.stringify(filter);
  const key = `${filterKey}|${reloads}`;
  const stored = orderCountsStore.useStoredOrderCounts();

  useEffect(() => {
    if (isShared && reloads === 0 && orderCountsStore.areOrderCountsFresh()) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      getManagerOrderCounts(controller.signal, filter).then(
        (counts) => setAnswer({ key, counts }),
        () => undefined,
      );
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [key, filter, delayMs, isShared, reloads]);

  const reload = useCallback(() => setReloads((count) => count + 1), []);
  const isForFilter = answer !== null && answer.key.startsWith(`${filterKey}|`);

  return {
    counts: (isShared ? stored : null) ?? answer?.counts ?? null,
    isCurrent: isForFilter,
    reload,
  };
}
