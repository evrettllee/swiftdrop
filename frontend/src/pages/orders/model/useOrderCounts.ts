import { useEffect, useMemo, useState } from 'react';
import { countOrders, type OrdersQuery } from '../api/list-orders';
import { ORDERS_TAB, ORDERS_TABS, type OrdersTab } from '../config/list';

export type OrderCounts = Record<OrdersTab, number | null>;

const UNKNOWN_COUNTS: OrderCounts = { active: null, finished: null, cancelled: null, all: null };

type CountsAnswer = { base: OrdersQuery; counts: OrderCounts };

export function useOrderCounts({ q, from, to }: OrdersQuery): OrderCounts {
  const [answer, setAnswer] = useState<CountsAnswer | null>(null);
  const base = useMemo<OrdersQuery>(
    () => ({ status: null, q, from, to, sort: null }),
    [q, from, to],
  );

  useEffect(() => {
    const controller = new AbortController();

    Promise.all(
      ORDERS_TABS.map((tab) =>
        countOrders({ ...base, status: tab === ORDERS_TAB.ALL ? null : tab }, controller.signal),
      ),
    ).then(
      ([active, finished, cancelled, all]) => {
        if (!controller.signal.aborted) {
          setAnswer({ base, counts: { active, finished, cancelled, all } });
        }
      },
      () => undefined,
    );

    return () => controller.abort();
  }, [base]);

  return answer?.base === base ? answer.counts : UNKNOWN_COUNTS;
}

export function useDraftCount(query: OrdersQuery | null, delayMs: number): number | null {
  const [answer, setAnswer] = useState<{ query: OrdersQuery; count: number } | null>(null);

  useEffect(() => {
    if (query === null) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      countOrders(query, controller.signal).then(
        (count) => {
          if (!controller.signal.aborted) {
            setAnswer({ query, count });
          }
        },
        () => undefined,
      );
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, delayMs]);

  return answer !== null && answer.query === query ? answer.count : null;
}
