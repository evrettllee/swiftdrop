import { SET_TIMEOUT_MAX_MS } from '../constants/realtime.constants';
import { sessionDisconnectDelayMs } from './session-expiry';

const NOW_MS = 1_000_000;
const LEFT_MS = 90_000;
// Far beyond what setTimeout can wait, like an access token that lives for years.
const FAR_FUTURE_MS = NOW_MS + SET_TIMEOUT_MAX_MS * 10;

describe('sessionDisconnectDelayMs', () => {
  it('should return the time left when the session ends later', () => {
    expect(sessionDisconnectDelayMs(NOW_MS + LEFT_MS, NOW_MS)).toBe(LEFT_MS);
  });

  it('should return zero or less when the session has already ended', () => {
    expect(sessionDisconnectDelayMs(NOW_MS, NOW_MS)).toBeLessThanOrEqual(0);
    expect(sessionDisconnectDelayMs(NOW_MS - LEFT_MS, NOW_MS)).toBeLessThanOrEqual(0);
  });

  it('should not exceed the setTimeout limit when the session ends very far ahead', () => {
    expect(sessionDisconnectDelayMs(FAR_FUTURE_MS, NOW_MS)).toBe(SET_TIMEOUT_MAX_MS);
  });
});
