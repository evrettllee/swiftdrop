import { ROLE } from '@/common/enums/role.enum';
import {
  ORDER_JOIN_MAX_ATTEMPTS,
  ORDER_JOIN_REJECTIONS,
  ORDER_JOIN_WINDOW_MS,
} from '../constants/realtime.constants';
import type { ClientSocketData } from '../types/realtime.types';
import { countJoinAttempt, rejectJoinAttempt } from './order-join';

const NOW_MS = 10_000_000;
const LATER_MS = NOW_MS + ORDER_JOIN_WINDOW_MS;

function attemptsWithin(count: number): number[] {
  return Array.from({ length: count }, (_, index) => NOW_MS - index);
}

function socketData(overrides: Partial<ClientSocketData> = {}): ClientSocketData {
  return {
    role: ROLE.CLIENT,
    userId: 1,
    sessionExpiresAtMs: LATER_MS,
    orderJoinAttemptsMs: [NOW_MS],
    ...overrides,
  };
}

describe('countJoinAttempt', () => {
  it('should add the attempt to the attempts of the window', () => {
    expect(countJoinAttempt([NOW_MS - 1], NOW_MS)).toEqual([NOW_MS - 1, NOW_MS]);
  });

  it('should drop the attempts that left the window', () => {
    const outside = NOW_MS - ORDER_JOIN_WINDOW_MS;

    expect(countJoinAttempt([outside, NOW_MS - 1], NOW_MS)).toEqual([NOW_MS - 1, NOW_MS]);
  });

  it('should keep no more than one attempt over the limit', () => {
    const attempts = countJoinAttempt(attemptsWithin(ORDER_JOIN_MAX_ATTEMPTS * 3), NOW_MS);

    expect(attempts).toHaveLength(ORDER_JOIN_MAX_ATTEMPTS + 1);
    expect(attempts.at(-1)).toBe(NOW_MS);
  });
});

describe('rejectJoinAttempt', () => {
  it('should allow the attempt when the limit is reached but not passed', () => {
    const data = socketData({ orderJoinAttemptsMs: attemptsWithin(ORDER_JOIN_MAX_ATTEMPTS) });

    expect(rejectJoinAttempt(data, NOW_MS)).toBeNull();
  });

  it('should refuse the attempt when it is one over the limit', () => {
    const data = socketData({ orderJoinAttemptsMs: attemptsWithin(ORDER_JOIN_MAX_ATTEMPTS + 1) });

    expect(rejectJoinAttempt(data, NOW_MS)).toBe(ORDER_JOIN_REJECTIONS.TOO_FREQUENT);
  });

  it('should refuse the attempt when the session has expired', () => {
    expect(rejectJoinAttempt(socketData({ sessionExpiresAtMs: NOW_MS }), NOW_MS)).toBe(
      ORDER_JOIN_REJECTIONS.SESSION_EXPIRED,
    );
  });
});
