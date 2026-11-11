import { useEffect, useState } from 'react';
import {
  getSupportTickets,
  SUPPORT_VIEW,
  type SupportTicketsQuery,
  type SupportView,
} from '@/shared/support-api';

const COUNT_LIMIT = 1;
const FIRST_PAGE = 1;

export type QueueFilters = Pick<SupportTicketsQuery, 'authorRole' | 'topics' | 'from' | 'to' | 'q'>;

export type QueueCounts = Record<SupportView, number>;

export async function countTickets(
  view: SupportView,
  filters: QueueFilters,
  signal: AbortSignal,
): Promise<number> {
  const page = await getSupportTickets(
    { ...filters, view, sort: null, page: FIRST_PAGE, limit: COUNT_LIMIT, until: null },
    { signal },
  );

  return page.total;
}

export async function loadQueueCounts(
  filters: QueueFilters,
  signal: AbortSignal,
): Promise<QueueCounts> {
  const [awaiting, open, closed] = await Promise.all([
    countTickets(SUPPORT_VIEW.AWAITING, filters, signal),
    countTickets(SUPPORT_VIEW.OPEN, filters, signal),
    countTickets(SUPPORT_VIEW.CLOSED, filters, signal),
  ]);

  return { awaiting, open, closed };
}

export function useTicketsCount(
  view: SupportView,
  filters: QueueFilters | null,
  delayMs: number,
): number | null {
  const [answer, setAnswer] = useState<{ filters: QueueFilters; count: number } | null>(null);

  useEffect(() => {
    if (filters === null) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      countTickets(view, filters, controller.signal).then(
        (count) => {
          if (!controller.signal.aborted) {
            setAnswer({ filters, count });
          }
        },
        () => undefined,
      );
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [view, filters, delayMs]);

  return answer !== null && answer.filters === filters ? answer.count : null;
}
