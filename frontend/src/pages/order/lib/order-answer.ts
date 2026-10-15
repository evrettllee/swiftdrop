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

export function toReadyAnswer(key: string, orderId: number, order: OrderDetails): StoredAnswer {
  return { key, orderId, status: LIST_STATUS.READY, order, isNotFound: false, message: null };
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
