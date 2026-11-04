import { useCallback, useMemo } from 'react';
import type { ListParams } from '@/shared/lib/list-params';
import { SOCKET_EVENTS, type TypedSocketEvent, useSocketEventBatch } from '@/shared/realtime';
import { getSupportCounts, isSearchUsable } from '@/shared/staff-api';
import { getSupportTickets, SUPPORT_VIEW, type SupportTicketsQuery } from '@/shared/support-api';
import { SUPPORT_PAGE_SIZE, type SupportParams } from '../config/params';
import { MANAGER_SUPPORT_TEXTS as TEXTS } from '../config/texts';
import { useLoad } from './useLoad';

const SUPPORT_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.SUPPORT_TICKET];

export type QueueCounts = { awaiting: number; open: number; closed: number };

async function loadCounts(signal: AbortSignal): Promise<QueueCounts> {
  const closedQuery: SupportTicketsQuery = {
    view: SUPPORT_VIEW.CLOSED,
    authorRole: null,
    q: null,
    sort: null,
    page: 1,
    limit: 1,
    until: null,
  };
  const [counts, closed] = await Promise.all([
    getSupportCounts(signal),
    getSupportTickets(closedQuery, { signal }),
  ]);

  return { awaiting: counts.awaiting, open: counts.open, closed: closed.total };
}

export function searchOf(q: string | null): string | null {
  return q !== null && isSearchUsable(q) ? q : null;
}

export function useSupportQueue(params: ListParams<SupportParams>) {
  const { values, until, setUntil, resetUntil } = params;
  const search = searchOf(values.q);
  const listKey = JSON.stringify([values.view, values.role, search, values.sort, values.page]);

  const query = useMemo(
    () => ({
      view: values.view,
      authorRole: values.role,
      q: search,
      sort: values.sort,
      page: values.page,
      limit: SUPPORT_PAGE_SIZE,
    }),
    [values.view, values.role, search, values.sort, values.page],
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
  const counts = useLoad('counts', loadCounts, TEXTS.LOAD_FAILED);
  const reloadList = list.reload;
  const reloadCounts = counts.reload;

  const reload = useCallback(() => {
    resetUntil();
    reloadList();
    reloadCounts();
  }, [resetUntil, reloadList, reloadCounts]);

  useSocketEventBatch(SUPPORT_EVENTS, reload);

  return { list, counts: counts.data, search, reload };
}
