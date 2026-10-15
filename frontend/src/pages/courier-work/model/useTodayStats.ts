import { useCallback, useEffect, useState } from 'react';
import type { CourierTodayStats } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { getTodayStats } from '../api/get-today-stats';

export type TodayStatsState = {
  status: ListStatus;
  // The last results that came, kept on screen while new ones load.
  stats: CourierTodayStats | null;
};

// The results of the day: loaded when the page opens and again on `reload` (after a change of the
// line). A failed reload keeps the results the page shows.
export function useTodayStats() {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<TodayStatsState>({ status: LIST_STATUS.LOADING, stats: null });

  useEffect(() => {
    const controller = new AbortController();

    getTodayStats(controller.signal).then(
      (stats) => setState({ status: LIST_STATUS.READY, stats }),
      () => {
        if (!controller.signal.aborted) {
          setState((current) =>
            current.stats === null ? { status: LIST_STATUS.ERROR, stats: null } : current,
          );
        }
      },
    );

    return () => controller.abort();
  }, [version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { ...state, reload };
}
