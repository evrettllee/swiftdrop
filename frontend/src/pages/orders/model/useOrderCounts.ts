import { useEffect, useState } from 'react';
import { listOrders } from '../api/list-orders';
import { ORDER_COUNT_PROBE_LIMIT, ORDER_LIST_FILTERS, ORDERS_FIRST_PAGE } from '../config/list';
import type { OrderListFilter } from './order-list';

type OrderCounts = Record<OrderListFilter, number | null>;

const UNKNOWN_COUNTS: OrderCounts = { all: null, active: null, finished: null };

// How many orders each tab holds. The counters are a hint: if they fail to load,
// the tabs are shown without numbers and the list works as usual.
export function useOrderCounts(): OrderCounts {
  const [counts, setCounts] = useState<OrderCounts>(UNKNOWN_COUNTS);

  useEffect(() => {
    const controller = new AbortController();

    async function load(): Promise<void> {
      try {
        const pages = await Promise.all(
          ORDER_LIST_FILTERS.map((filter) =>
            listOrders(
              { page: ORDERS_FIRST_PAGE, filter, limit: ORDER_COUNT_PROBE_LIMIT },
              { signal: controller.signal },
            ),
          ),
        );

        if (!controller.signal.aborted) {
          setCounts({ all: pages[0].total, active: pages[1].total, finished: pages[2].total });
        }
      } catch {
        // The tabs stay without numbers.
      }
    }

    void load();

    return () => controller.abort();
  }, []);

  return counts;
}
