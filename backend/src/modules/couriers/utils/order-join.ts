import {
  ORDER_JOIN_MAX_ATTEMPTS,
  ORDER_JOIN_REJECTIONS,
  ORDER_JOIN_WINDOW_MS,
} from '../constants/couriers-socket.constants';
import type { AppSocketData, OrderJoinRejection } from '../types/couriers-socket.types';

// The join attempts of the last window with this one added. Only one more than the limit is kept,
// so a flood of joins cannot grow the list.
export function countJoinAttempt(attemptsMs: readonly number[], nowMs: number): number[] {
  return [...attemptsMs.filter((atMs) => nowMs - atMs < ORDER_JOIN_WINDOW_MS), nowMs].slice(
    -(ORDER_JOIN_MAX_ATTEMPTS + 1),
  );
}

// Why this socket cannot try a join now, or null when it can. The attempt is already counted.
export function rejectJoinAttempt(data: AppSocketData, nowMs: number): OrderJoinRejection | null {
  let rejection: OrderJoinRejection | null = null;

  if (nowMs >= data.sessionExpiresAtMs) {
    rejection = ORDER_JOIN_REJECTIONS.SESSION_EXPIRED;
  } else if (data.orderJoinAttemptsMs.length > ORDER_JOIN_MAX_ATTEMPTS) {
    rejection = ORDER_JOIN_REJECTIONS.TOO_FREQUENT;
  }

  return rejection;
}
