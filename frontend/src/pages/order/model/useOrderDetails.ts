import { useCallback, useEffect, useState } from 'react';
import { ApiError, getApiErrorMessage, HTTP_STATUS, type OrderDetails } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { getOrderDetails } from '../api/get-order-details';
import { ORDER_DETAILS_TEXTS } from '../config/texts';

type StoredAnswer = {
  key: string;
  orderId: number | null;
  status: ListStatus;
  order: OrderDetails | null;
  isNotFound: boolean;
  message: string | null;
};

const NO_ANSWER: StoredAnswer = {
  key: '',
  orderId: null,
  status: LIST_STATUS.LOADING,
  order: null,
  isNotFound: false,
  message: null,
};

function isValidOrderId(orderId: number): boolean {
  return Number.isInteger(orderId) && orderId > 0;
}

// One order of the client. `reload` asks the server again (after a cancel or a payment) and keeps
// the shown order until the new answer comes; a wrong id in the address is a missing order.
export function useOrderDetails(orderId: number) {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<StoredAnswer>(NO_ANSWER);
  const isValidId = isValidOrderId(orderId);
  const currentKey = `${orderId}:${attempt}`;

  useEffect(() => {
    if (!isValidId) {
      return;
    }

    let isCurrent = true;
    const key = `${orderId}:${attempt}`;

    async function load(): Promise<void> {
      try {
        const order = await getOrderDetails(orderId);

        if (isCurrent) {
          setAnswer({
            key,
            orderId,
            status: LIST_STATUS.READY,
            order,
            isNotFound: false,
            message: null,
          });
        }
      } catch (error) {
        if (isCurrent) {
          setAnswer({
            key,
            orderId,
            status: LIST_STATUS.ERROR,
            order: null,
            isNotFound: error instanceof ApiError && error.status === HTTP_STATUS.NOT_FOUND,
            message: getApiErrorMessage(error, ORDER_DETAILS_TEXTS.LOAD_FAILED),
          });
        }
      }
    }

    void load();

    return () => {
      isCurrent = false;
    };
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
