import { useCallback, useEffect, useState } from 'react';
import type { ClientOrderCourier, OrderStatus } from '@/shared/api';
import { getOrderCourier } from '../api/get-order-courier';
import { CODE_VISIBLE_STATUSES, COURIER_VISIBLE_STATUSES } from './order-status-groups';

type StoredCourier = { orderId: number | null; answer: ClientOrderCourier | null };

const NOTHING: StoredCourier = { orderId: null, answer: null };

// Who carries the order and the code for them. Asked for from the assignment on and again when the
// status changes or `refresh` is called; a failed request changes nothing (the next one tries
// again). What the status does not allow to show is not shown, whatever came earlier, so the code
// is gone the moment the parcel is handed over.
export function useOrderCourier(orderId: number, status: OrderStatus | null) {
  const [tick, setTick] = useState(0);
  const [stored, setStored] = useState<StoredCourier>(NOTHING);
  const isVisible = status !== null && COURIER_VISIBLE_STATUSES.includes(status);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const controller = new AbortController();

    getOrderCourier(orderId, { signal: controller.signal }).then(
      (answer) => {
        if (!controller.signal.aborted) {
          setStored({ orderId, answer });
        }
      },
      () => undefined,
    );

    return () => controller.abort();
  }, [orderId, status, tick, isVisible]);

  const refresh = useCallback(() => setTick((current) => current + 1), []);
  const answer = isVisible && stored.orderId === orderId ? stored.answer : null;
  const isCodeVisible = status !== null && CODE_VISIBLE_STATUSES.includes(status);

  return {
    courier: answer?.courier ?? null,
    deliveryCode: isCodeVisible ? (answer?.deliveryCode ?? null) : null,
    refresh,
  };
}
