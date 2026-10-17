import { useRef, useState } from 'react';
import {
  API_ERROR_MESSAGES,
  ApiError,
  type CourierOrder,
  getApiErrorMessage,
  HTTP_STATUS,
} from '@/shared/api';
import { departOrder, pickUpOrder } from '../api/courier-order';
import { ORDER_ACTION, type OrderAction } from '../config/order-steps';

// The order has moved on without this screen (cancelled, or already at another stage): the
// screen loads it again to show where it is.
const STALE_ORDER_STATUSES: ReadonlySet<number> = new Set([
  HTTP_STATUS.NOT_FOUND,
  HTTP_STATUS.CONFLICT,
]);

const STEP_REQUESTS: Partial<Record<OrderAction, (orderId: number) => Promise<CourierOrder>>> = {
  [ORDER_ACTION.PICK_UP]: pickUpOrder,
  [ORDER_ACTION.DEPART]: departOrder,
};

type OrderStepOptions = {
  onDone: (order: CourierOrder) => void;
  onStale: () => void;
};

// The next step of the courier through the order. A second press is ignored until the answer;
// the error is the text of the backend.
export function useOrderStep({ onDone, onStale }: OrderStepOptions) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set at once, so a second press is ignored before any render could mark the button busy.
  const isBusy = useRef(false);

  async function run(orderId: number, action: OrderAction): Promise<void> {
    const request = STEP_REQUESTS[action];

    if (request === undefined || isBusy.current) {
      return;
    }

    isBusy.current = true;
    setIsPending(true);
    setError(null);

    try {
      onDone(await request(orderId));
    } catch (failure) {
      setError(getApiErrorMessage(failure, API_ERROR_MESSAGES.GENERIC));

      if (failure instanceof ApiError && STALE_ORDER_STATUSES.has(failure.status)) {
        onStale();
      }
    } finally {
      isBusy.current = false;
      setIsPending(false);
    }
  }

  return { isPending, error, run };
}
