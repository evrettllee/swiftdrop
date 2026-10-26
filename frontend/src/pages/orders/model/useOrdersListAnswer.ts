import { useEffect, useState } from 'react';
import { listOrders } from '../api/list-orders';
import { toFailedListAnswer, toReadyListAnswer } from '../lib/orders-list';
import { type ListRequest, ORDERS_LIST_INITIAL_STATE, type StoredListAnswer } from './order-list';

const NO_ANSWER: StoredListAnswer = { ...ORDERS_LIST_INITIAL_STATE, filter: null, key: '' };

// Loads the page of the request and keeps the last answer. A request that is not needed any more
// (another filter or page, the page left) is cancelled, so an old answer never replaces a new one.
export function useOrdersListAnswer({
  filter,
  page,
  mode,
  attempt,
}: ListRequest): StoredListAnswer {
  const [answer, setAnswer] = useState<StoredListAnswer>(NO_ANSWER);

  useEffect(() => {
    const controller = new AbortController();
    const request: ListRequest = { filter, page, mode, attempt };

    async function load(): Promise<void> {
      try {
        const result = await listOrders({ page, filter }, { signal: controller.signal });

        if (!controller.signal.aborted) {
          setAnswer((previous) => toReadyListAnswer(previous, request, result));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setAnswer((previous) => toFailedListAnswer(previous, request, error));
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [filter, page, mode, attempt]);

  return answer;
}
