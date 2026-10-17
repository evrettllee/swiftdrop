import { useEffect, useState } from 'react';
import { getOrderDetails } from '../api/get-order-details';
import { orderRequestKey, toFailedAnswer, toReadyAnswer } from '../lib/order-answer';
import { NO_ANSWER, type StoredAnswer } from './order-answer';

// `attempt` grows with every request; a silent one (the polling) keeps what is shown when it fails.
export type OrderRequest = { attempt: number; isSilent: boolean };

// Loads the order of the request and keeps the last answer. A request that is not needed any more
// (another order, a newer request, the page left) is cancelled, so an old answer never replaces a
// new one. Nothing is asked for an address that is not an order.
export function useOrderAnswer(
  orderId: number,
  request: OrderRequest,
  isValidId: boolean,
): StoredAnswer {
  const [answer, setAnswer] = useState<StoredAnswer>(NO_ANSWER);

  useEffect(() => {
    if (!isValidId) {
      return undefined;
    }

    const controller = new AbortController();
    const key = orderRequestKey(orderId, request.attempt);

    async function load(): Promise<void> {
      try {
        const order = await getOrderDetails(orderId, { signal: controller.signal });

        if (!controller.signal.aborted) {
          setAnswer((previous) => toReadyAnswer(key, orderId, order, previous));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setAnswer((previous) =>
            request.isSilent && previous.order !== null && previous.orderId === orderId
              ? { ...previous, key }
              : toFailedAnswer(key, orderId, error),
          );
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [orderId, request, isValidId]);

  return answer;
}
