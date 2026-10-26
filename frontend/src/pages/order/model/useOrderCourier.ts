import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ApiError,
  type ClientOrderCourier,
  NETWORK_ERROR_STATUS,
  type OrderStatus,
  isTransientStatus,
} from '@/shared/api';
import { getOrderCourier } from '../api/get-order-courier';
import { ORDER_COURIER_RETRIES_WHEN_FINISHED, ORDER_COURIER_RETRY_MS } from '../config/tracking';
import {
  CODE_VISIBLE_STATUSES,
  COURIER_VISIBLE_STATUSES,
  FINISHED_STATUSES,
} from './order-status-groups';

type StoredCourier = { orderId: number | null; answer: ClientOrderCourier | null };

const NOTHING: StoredCourier = { orderId: null, answer: null };

// Who carries the order and the code for them. Asked for from the assignment on and again when the
// status changes or `refresh` is called. A failed request changes nothing and is repeated quietly
// after ORDER_COURIER_RETRY_MS when the failure may pass (the network, a limit, the server): a
// refused one (401, 403, 404...) is not. An order that no longer changes (delivered) gets
// one repeat. What the status does not allow to show is not shown, whatever came earlier, so the
// code is gone the moment the parcel is handed over.
export function useOrderCourier(orderId: number, status: OrderStatus | null) {
  const [tick, setTick] = useState(0);
  const [stored, setStored] = useState<StoredCourier>(NOTHING);
  const isVisible = status !== null && COURIER_VISIBLE_STATUSES.includes(status);
  const isFinished = status !== null && FINISHED_STATUSES.includes(status);
  // The repeats made for this order at this status.
  const retries = useRef({ key: '', used: 0 });

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const key = `${orderId}:${status}`;

    if (retries.current.key !== key) {
      retries.current = { key, used: 0 };
    }

    const controller = new AbortController();
    let timer: number | undefined;

    getOrderCourier(orderId, { signal: controller.signal }).then(
      (answer) => {
        if (!controller.signal.aborted) {
          setStored({ orderId, answer });
        }
      },
      (error: unknown) => {
        const failure = error instanceof ApiError ? error.status : NETWORK_ERROR_STATUS;
        const hasRetriesLeft =
          !isFinished || retries.current.used < ORDER_COURIER_RETRIES_WHEN_FINISHED;

        if (!controller.signal.aborted && isTransientStatus(failure) && hasRetriesLeft) {
          retries.current.used += 1;
          timer = window.setTimeout(
            () => setTick((current) => current + 1),
            ORDER_COURIER_RETRY_MS,
          );
        }
      },
    );

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [orderId, status, tick, isVisible, isFinished]);

  const refresh = useCallback(() => setTick((current) => current + 1), []);
  const answer = isVisible && stored.orderId === orderId ? stored.answer : null;
  const isCodeVisible = status !== null && CODE_VISIBLE_STATUSES.includes(status);

  return {
    courier: answer?.courier ?? null,
    deliveryCode: isCodeVisible ? (answer?.deliveryCode ?? null) : null,
    refresh,
  };
}
