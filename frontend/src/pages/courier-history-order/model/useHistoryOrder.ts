import { useEffect, useState } from 'react';
import { ApiError, type CourierHistoryOrder, HTTP_STATUS } from '@/shared/api';
import { LIST_STATUS, type ListStatus } from '@/shared/config';
import { getHistoryOrder } from '../api/get-history-order';

type OrderAnswer = {
  key: string;
  status: ListStatus;
  order: CourierHistoryOrder | null;
  isNotFound: boolean;
};

const LOADING: OrderAnswer = {
  key: '',
  status: LIST_STATUS.LOADING,
  order: null,
  isNotFound: false,
};
const NOT_FOUND: OrderAnswer = { ...LOADING, status: LIST_STATUS.ERROR, isNotFound: true };

// An address that is not the number of an order has no order behind it.
function isOrderId(orderId: number): boolean {
  return Number.isSafeInteger(orderId) && orderId > 0;
}

// A finished order of the courier. Another order or a new try cancels the request that is not
// needed any more; "loading" means the stored answer belongs to another request.
export function useHistoryOrder(orderId: number) {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<OrderAnswer>(LOADING);
  const key = `${orderId}:${attempt}`;

  useEffect(() => {
    if (!isOrderId(orderId)) {
      return undefined;
    }

    const controller = new AbortController();

    getHistoryOrder(orderId, controller.signal).then(
      (order) => {
        if (!controller.signal.aborted) {
          setAnswer({ key, status: LIST_STATUS.READY, order, isNotFound: false });
        }
      },
      (failure: unknown) => {
        if (!controller.signal.aborted) {
          const isNotFound =
            failure instanceof ApiError && failure.status === HTTP_STATUS.NOT_FOUND;

          setAnswer({ key, status: LIST_STATUS.ERROR, order: null, isNotFound });
        }
      },
    );

    return () => controller.abort();
  }, [orderId, key]);

  const state = !isOrderId(orderId) ? NOT_FOUND : answer;

  return {
    ...(state.key === key || state === NOT_FOUND ? state : LOADING),
    retry: () => setAttempt((current) => current + 1),
  };
}
