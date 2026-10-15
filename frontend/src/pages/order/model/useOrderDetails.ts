import { useCallback, useEffect, useState } from 'react';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { getOrderDetails } from '../api/get-order-details';
import {
  isValidOrderId,
  orderRequestKey,
  toFailedAnswer,
  toReadyAnswer,
} from '../lib/order-answer';
import { NO_ANSWER, type StoredAnswer } from './order-answer';

// One order of the client. `reload` asks the server again (after a cancel or a payment) and keeps
// the shown order until the new answer comes; a wrong id in the address is a missing order. A
// request that is not needed any more (another order, a newer reload, the page left) is cancelled.
export function useOrderDetails(orderId: number) {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<StoredAnswer>(NO_ANSWER);
  const isValidId = isValidOrderId(orderId);
  const currentKey = orderRequestKey(orderId, attempt);

  useEffect(() => {
    if (!isValidId) {
      return undefined;
    }

    const controller = new AbortController();
    const key = orderRequestKey(orderId, attempt);

    async function load(): Promise<void> {
      try {
        const order = await getOrderDetails(orderId, { signal: controller.signal });

        if (!controller.signal.aborted) {
          setAnswer(toReadyAnswer(key, orderId, order));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setAnswer(toFailedAnswer(key, orderId, error));
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [orderId, attempt, isValidId]);

  // Stable, so effects that reload the order do not restart on every render.
  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  const isSameOrder = answer.orderId === orderId;
  const isAnswered = isSameOrder && answer.key === currentKey;
  let status: ListStatus = LIST_STATUS.LOADING;

  if (!isValidId) {
    status = LIST_STATUS.ERROR;
  } else if (isAnswered) {
    status = answer.status;
  }

  return {
    status,
    order: isSameOrder ? answer.order : null,
    isNotFound: !isValidId || (isAnswered && answer.isNotFound),
    message: isAnswered ? answer.message : null,
    reload,
  };
}
