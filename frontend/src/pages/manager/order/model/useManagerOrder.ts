import { useCallback, useEffect, useState } from 'react';
import { ApiError, HTTP_STATUS } from '@/shared/api';
import { getManagerOrder, type ManagerOrderDetails } from '@/shared/staff-api';

export const ORDER_LOAD = {
  LOADING: 'loading',
  READY: 'ready',
  NOT_FOUND: 'notFound',
  ERROR: 'error',
} as const;

export type OrderLoad = (typeof ORDER_LOAD)[keyof typeof ORDER_LOAD];

type Answer = {
  orderId: number;
  attempt: number;
  isNotFound: boolean;
  order: ManagerOrderDetails | null;
};

const MISSING_STATUSES: ReadonlySet<number> = new Set([
  HTTP_STATUS.NOT_FOUND,
  HTTP_STATUS.BAD_REQUEST,
]);

function keepRoute(previous: Answer | null, order: ManagerOrderDetails): ManagerOrderDetails {
  const shown = previous?.orderId === order.id ? previous.order : null;

  return shown !== null && JSON.stringify(shown.route) === JSON.stringify(order.route)
    ? { ...order, route: shown.route }
    : order;
}

function isMissing(error: unknown): boolean {
  return error instanceof ApiError && MISSING_STATUSES.has(error.status);
}

export function useManagerOrder(orderId: number | null) {
  const [attempt, setAttempt] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    if (orderId === null) {
      return undefined;
    }

    const controller = new AbortController();

    getManagerOrder(orderId, { signal: controller.signal }).then(
      (order) =>
        setAnswer((previous) => ({
          orderId,
          attempt,
          isNotFound: false,
          order: keepRoute(previous, order),
        })),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setAnswer((previous) => ({
            orderId,
            attempt,
            isNotFound: isMissing(error),
            order: previous?.orderId === orderId && !isMissing(error) ? previous.order : null,
          }));
        }
      },
    );

    return () => controller.abort();
  }, [orderId, attempt]);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);
  const isSameOrder = orderId !== null && answer?.orderId === orderId;
  const order = isSameOrder ? answer.order : null;
  let load: OrderLoad = ORDER_LOAD.LOADING;

  if (orderId === null || (isSameOrder && answer.isNotFound)) {
    load = ORDER_LOAD.NOT_FOUND;
  } else if (order !== null) {
    load = ORDER_LOAD.READY;
  } else if (isSameOrder && answer.attempt === attempt) {
    load = ORDER_LOAD.ERROR;
  }

  return { load, order, reload };
}
