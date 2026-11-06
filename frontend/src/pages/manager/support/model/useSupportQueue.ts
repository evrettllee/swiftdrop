import { useCallback, useMemo } from 'react';
import { useLoad } from '@/shared/lib/async';
import { LIST_PAGE_SIZE, type ListParams } from '@/shared/lib/list-params';
import { SOCKET_EVENTS, type TypedSocketEvent, useSocketEventBatch } from '@/shared/realtime';
import { isSearchUsable } from '@/shared/staff-api';
import { getSupportTickets } from '@/shared/support-api';
import type { SupportParams } from '../config/params';
import { MANAGER_SUPPORT_TEXTS as TEXTS } from '../config/texts';
import { filtersPeriod } from './support-filters';
import { loadQueueCounts, type QueueFilters } from './ticket-counts';

const SUPPORT_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.SUPPORT_TICKET];

export function searchOf(q: string | null): string | null {
  return q !== null && isSearchUsable(q) ? q : null;
}

export function useSupportQueue(params: ListParams<SupportParams>) {
  const { values, until, setUntil, resetUntil } = params;
  const search = searchOf(values.q);
  const { from, to } = filtersPeriod(values);
  const filters = useMemo<QueueFilters>(
    () => ({ authorRole: values.role, topics: values.topic, from, to, q: search }),
    [values.role, values.topic, from, to, search],
  );
  const filtersKey = JSON.stringify(filters);
  const listKey = JSON.stringify([filtersKey, values.view, values.sort, values.page]);

  const query = useMemo(
    () => ({
      ...filters,
      view: values.view,
      sort: values.sort,
      page: values.page,
      limit: LIST_PAGE_SIZE,
    }),
    [filters, values.view, values.sort, values.page],
  );

  const list = useLoad(
    listKey,
    async (signal) => {
      const page = await getSupportTickets({ ...query, until }, { signal });

      if (until === null) {
        setUntil(page.until);
      }

      return page;
    },
    TEXTS.LOAD_FAILED,
  );
  const counts = useLoad(
    filtersKey,
    (signal) => loadQueueCounts(filters, signal),
    TEXTS.LOAD_FAILED,
  );
  const reloadList = list.reload;
  const reloadCounts = counts.reload;

  const reload = useCallback(() => {
    resetUntil();
    reloadList();
    reloadCounts();
  }, [resetUntil, reloadList, reloadCounts]);

  useSocketEventBatch(SUPPORT_EVENTS, reload);

  return { list, counts: counts.data, filters, search, reload };
}
