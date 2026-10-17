import {
  API_ERROR_MESSAGES,
  ApiError,
  HTTP_STATUS,
  NETWORK_ERROR_STATUS,
  SERVER_ERROR_STATUS_MIN,
} from '@/shared/api';

// What a refused code means for the screen. The backend counts the tries and locks them; the
// screen only tells its text.
export const DELIVERY_FAILURE = {
  // The code is wrong: the cells turn red and the field is cleared for a new try.
  WRONG_CODE: 'wrongCode',
  // Too many wrong tries: the field is cleared, the backend says when to try again.
  LOCKED: 'locked',
  // The order has moved on without this screen: the order screen loads it again.
  STALE: 'stale',
  // Anything else: the code stays for one more press.
  OTHER: 'other',
} as const;

type DeliveryFailureKind = (typeof DELIVERY_FAILURE)[keyof typeof DELIVERY_FAILURE];

export type DeliveryFailure = {
  kind: DeliveryFailureKind;
  message: string;
};

const KINDS_BY_STATUS: ReadonlyMap<number, DeliveryFailureKind> = new Map([
  [HTTP_STATUS.UNPROCESSABLE_CONTENT, DELIVERY_FAILURE.WRONG_CODE],
  [HTTP_STATUS.TOO_MANY_REQUESTS, DELIVERY_FAILURE.LOCKED],
  [HTTP_STATUS.NOT_FOUND, DELIVERY_FAILURE.STALE],
  [HTTP_STATUS.CONFLICT, DELIVERY_FAILURE.STALE],
]);

// The text of the backend for its own answers; the common text for no connection and a failure
// of the server.
export function readDeliveryFailure(failure: unknown): DeliveryFailure {
  if (!(failure instanceof ApiError) || failure.status >= SERVER_ERROR_STATUS_MIN) {
    return { kind: DELIVERY_FAILURE.OTHER, message: API_ERROR_MESSAGES.GENERIC };
  }

  if (failure.status === NETWORK_ERROR_STATUS) {
    return { kind: DELIVERY_FAILURE.OTHER, message: API_ERROR_MESSAGES.NETWORK };
  }

  return {
    kind: KINDS_BY_STATUS.get(failure.status) ?? DELIVERY_FAILURE.OTHER,
    message: failure.message,
  };
}
