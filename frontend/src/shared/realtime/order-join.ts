import { z } from 'zod';
import { MS_PER_SECOND } from '@/shared/config';

// Why the backend did not let the socket into the room of an order (the reason of the
// acknowledgement of order:join); must match ORDER_JOIN_REJECTIONS of the backend. A foreign order
// and a missing one get the same not_found. unauthorized is not sent today: a blocked account gets
// not_found and a closed socket; it is still handled as a closed socket should it come.
export const ORDER_JOIN_REJECTION = {
  INVALID: 'invalid',
  SESSION_EXPIRED: 'session_expired',
  UNAUTHORIZED: 'unauthorized',
  TOO_FREQUENT: 'too_frequent',
  TOO_MANY_ROOMS: 'too_many_rooms',
  NOT_FOUND: 'not_found',
  UNAVAILABLE: 'unavailable',
} as const;

export const orderJoinAckSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), reason: z.enum(ORDER_JOIN_REJECTION) }),
]);

export type OrderJoinAck = z.infer<typeof orderJoinAckSchema>;

// A join not acknowledged in this time counts as failed for a while: it is asked again later.
export const ORDER_JOIN_ACK_TIMEOUT_MS = 10 * MS_PER_SECOND;

// A refused join that may pass is asked again after 5, 10, 20, 40 and then every 60 seconds. The
// backend takes 20 joins a minute from a socket, whatever the rooms: one room asks at most 12 times
// in its first minute, then once a minute.
export const ORDER_JOIN_RETRY_FIRST_MS = 5 * MS_PER_SECOND;
export const ORDER_JOIN_RETRY_MAX_MS = 60 * MS_PER_SECOND;

// What a join ended with, for the room that asked.
export const JOIN_OUTCOME = {
  JOINED: 'joined',
  // Refused for good: a foreign or missing order, a broken request.
  REFUSED: 'refused',
  // Asked again after a delay: too many joins or rooms, the backend could not check, no answer.
  RETRY: 'retry',
  // The access token of the socket has expired: the session is refreshed and the socket opened
  // again, which joins the room again.
  REFRESH: 'refresh',
  // The account was blocked: the socket is closed.
  CLOSE: 'close',
} as const;

export type JoinOutcome = (typeof JOIN_OUTCOME)[keyof typeof JOIN_OUTCOME];

type OrderJoinRejection = (typeof ORDER_JOIN_REJECTION)[keyof typeof ORDER_JOIN_REJECTION];

const OUTCOME_OF_REJECTION: Record<OrderJoinRejection, JoinOutcome> = {
  [ORDER_JOIN_REJECTION.INVALID]: JOIN_OUTCOME.REFUSED,
  [ORDER_JOIN_REJECTION.NOT_FOUND]: JOIN_OUTCOME.REFUSED,
  [ORDER_JOIN_REJECTION.SESSION_EXPIRED]: JOIN_OUTCOME.REFRESH,
  [ORDER_JOIN_REJECTION.UNAUTHORIZED]: JOIN_OUTCOME.CLOSE,
  [ORDER_JOIN_REJECTION.TOO_FREQUENT]: JOIN_OUTCOME.RETRY,
  [ORDER_JOIN_REJECTION.TOO_MANY_ROOMS]: JOIN_OUTCOME.RETRY,
  [ORDER_JOIN_REJECTION.UNAVAILABLE]: JOIN_OUTCOME.RETRY,
};

// The acknowledgement, or null when none came in time or it is broken.
export function toJoinOutcome(ack: OrderJoinAck | null): JoinOutcome {
  if (ack === null) {
    return JOIN_OUTCOME.RETRY;
  }

  return ack.ok ? JOIN_OUTCOME.JOINED : OUTCOME_OF_REJECTION[ack.reason];
}

// The delay before the next attempt after `previousMs` (0 before the first retry).
export function nextJoinDelay(previousMs: number): number {
  return previousMs === 0
    ? ORDER_JOIN_RETRY_FIRST_MS
    : Math.min(previousMs * 2, ORDER_JOIN_RETRY_MAX_MS);
}
