import { SET_TIMEOUT_MAX_MS } from '../constants/realtime.constants';

// How long a socket may stay open before its session ends: zero or less when it already has.
// Capped at what setTimeout can wait, since a longer delay would fire at once.
export function sessionDisconnectDelayMs(expiresAtMs: number, nowMs: number): number {
  return Math.min(expiresAtMs - nowMs, SET_TIMEOUT_MAX_MS);
}
