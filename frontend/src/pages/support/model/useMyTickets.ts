import { useState } from 'react';
import { useLoad } from '@/shared/lib/async';
import { SOCKET_EVENTS, type TypedSocketEvent, useSocketEventBatch } from '@/shared/realtime';
import { SUPPORT_TICKET_STATUS, type SupportTicketStatus } from '@/shared/staff-api';
import {
  getMyTickets,
  MY_TICKETS_LIMIT,
  type MyTicketItem,
  type MyTicketsPage,
} from '@/shared/support-api';
import { SUPPORT_TEXTS } from '../config/texts';

const TICKET_EVENTS: readonly TypedSocketEvent[] = [SOCKET_EVENTS.SUPPORT_TICKET];
const COUNT_LIMIT = 1;

type More = {
  base: MyTicketsPage | null;
  items: MyTicketItem[];
  nextCursor: string | null;
  isLoading: boolean;
  isFailed: boolean;
};

const NO_MORE: More = {
  base: null,
  items: [],
  nextCursor: null,
  isLoading: false,
  isFailed: false,
};

function otherStatus(status: SupportTicketStatus): SupportTicketStatus {
  return status === SUPPORT_TICKET_STATUS.OPEN
    ? SUPPORT_TICKET_STATUS.CLOSED
    : SUPPORT_TICKET_STATUS.OPEN;
}

function totalOf(page: MyTicketsPage | null): number | null {
  return page === null ? null : (page.total ?? page.items.length);
}

function useMorePages(status: SupportTicketStatus, first: MyTicketsPage | null) {
  const [more, setMore] = useState<More>(NO_MORE);
  const current = more.base === first ? more : { ...NO_MORE, base: first };
  const cursor = current.items.length === 0 ? (first?.nextCursor ?? null) : current.nextCursor;

  async function loadMore(): Promise<void> {
    if (cursor === null || current.isLoading) {
      return;
    }

    setMore({ ...current, isLoading: true, isFailed: false });

    try {
      const page = await getMyTickets({ status, cursor, limit: MY_TICKETS_LIMIT });
      setMore((value) =>
        value.base === first
          ? {
              ...value,
              items: [...value.items, ...page.items],
              nextCursor: page.nextCursor,
              isLoading: false,
            }
          : value,
      );
    } catch {
      setMore((value) =>
        value.base === first ? { ...value, isLoading: false, isFailed: true } : value,
      );
    }
  }

  return {
    items: current.items,
    hasMore: cursor !== null,
    isLoading: current.isLoading,
    isFailed: current.isFailed,
    loadMore: () => void loadMore(),
  };
}

export function useMyTickets(status: SupportTicketStatus) {
  const other = otherStatus(status);
  const first = useLoad(
    `list:${status}`,
    (signal) => getMyTickets({ status, cursor: null, limit: MY_TICKETS_LIMIT }, { signal }),
    SUPPORT_TEXTS.LOAD_FAILED,
  );
  const otherFirst = useLoad(
    `count:${other}`,
    (signal) => getMyTickets({ status: other, cursor: null, limit: COUNT_LIMIT }, { signal }),
    SUPPORT_TEXTS.LOAD_FAILED,
  );
  const more = useMorePages(status, first.data);

  useSocketEventBatch(TICKET_EVENTS, () => {
    first.reload();
    otherFirst.reload();
  });

  const counts: Record<SupportTicketStatus, number | null> = {
    [SUPPORT_TICKET_STATUS.OPEN]: null,
    [SUPPORT_TICKET_STATUS.CLOSED]: null,
  };
  counts[status] = totalOf(first.data);
  counts[other] = totalOf(otherFirst.data);

  return {
    first,
    items: first.data === null ? [] : [...first.data.items, ...more.items],
    counts,
    more,
  };
}

export type MyTickets = ReturnType<typeof useMyTickets>;
