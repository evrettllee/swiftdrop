import {
  LOCATION_MIN_INTERVAL_MS,
  LOCATION_UPDATE_REJECTIONS,
} from '../constants/couriers-socket.constants';
import type { CourierSocketData } from '../types/couriers-socket.types';
import { rejectLocationUpdate } from './location-update';

const NOW_MS = 1_000_000;
const LATER_MS = 2_000_000;

function socketData(overrides: Partial<CourierSocketData> = {}): CourierSocketData {
  return {
    userId: 1,
    courierProfileId: 1,
    sessionExpiresAtMs: LATER_MS,
    lastLocationAtMs: null,
    ...overrides,
  };
}

describe('rejectLocationUpdate', () => {
  it('should accept the first position when the session is valid', () => {
    expect(rejectLocationUpdate(socketData(), NOW_MS)).toBeNull();
  });

  it('should reject the position when the session has expired', () => {
    expect(rejectLocationUpdate(socketData({ sessionExpiresAtMs: NOW_MS }), NOW_MS)).toBe(
      LOCATION_UPDATE_REJECTIONS.SESSION_EXPIRED,
    );
  });

  it('should reject the position when the previous one came less than the interval ago', () => {
    const data = socketData({ lastLocationAtMs: NOW_MS - LOCATION_MIN_INTERVAL_MS + 1 });

    expect(rejectLocationUpdate(data, NOW_MS)).toBe(LOCATION_UPDATE_REJECTIONS.TOO_FREQUENT);
  });

  it('should accept the position when exactly the interval has passed', () => {
    const data = socketData({ lastLocationAtMs: NOW_MS - LOCATION_MIN_INTERVAL_MS });

    expect(rejectLocationUpdate(data, NOW_MS)).toBeNull();
  });
});
