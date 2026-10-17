import { ApiError, getApiErrorMessage, HTTP_STATUS, type OrderDetails } from '@/shared/api';
import { LIST_STATUS } from '@/shared/config';
import { ORDER_DETAILS_TEXTS } from '../config/texts';
import type { StoredAnswer } from '../model/order-answer';

export function isValidOrderId(orderId: number): boolean {
  return Number.isInteger(orderId) && orderId > 0;
}

// The request of an order: a reload asks the same order again under a new key.
export function orderRequestKey(orderId: number, attempt: number): string {
  return `${orderId}:${attempt}`;
}

function isSame(first: unknown, second: unknown): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

// The order that came again keeps the objects of what did not change, so the page and the map do
// not react to an answer that says the same (the map would fit its route again).
function shareUnchanged(previous: OrderDetails | null, order: OrderDetails): OrderDetails {
  if (previous === null) {
    return order;
  }

  return isSame(previous, order)
    ? previous
    : {
        ...order,
        pickup: isSame(previous.pickup, order.pickup) ? previous.pickup : order.pickup,
        delivery: isSame(previous.delivery, order.delivery) ? previous.delivery : order.delivery,
      };
}

export function toReadyAnswer(
  key: string,
  orderId: number,
  order: OrderDetails,
  previous: StoredAnswer,
): StoredAnswer {
  const shown = previous.orderId === orderId ? previous.order : null;

  return {
    key,
    orderId,
    status: LIST_STATUS.READY,
    order: shareUnchanged(shown, order),
    isNotFound: false,
    message: null,
  };
}

export function toFailedAnswer(key: string, orderId: number, error: unknown): StoredAnswer {
  return {
    key,
    orderId,
    status: LIST_STATUS.ERROR,
    order: null,
    isNotFound: error instanceof ApiError && error.status === HTTP_STATUS.NOT_FOUND,
    message: getApiErrorMessage(error, ORDER_DETAILS_TEXTS.LOAD_FAILED),
  };
}
