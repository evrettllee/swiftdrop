import { DEFAULT_THROTTLER_NAME } from '../constants/http';

// @Throttle overrides a throttler by name: the global one is registered without a name.
export function buildThrottleOverride(limit: number, ttlMs: number) {
  return { [DEFAULT_THROTTLER_NAME]: { limit, ttl: ttlMs } };
}
