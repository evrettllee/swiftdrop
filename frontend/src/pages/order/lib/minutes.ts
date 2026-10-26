import { MS_PER_MINUTE } from '@/shared/config';

export function minutesUntil(targetMs: number, nowMs: number): number {
  return Math.max(1, Math.ceil((targetMs - nowMs) / MS_PER_MINUTE));
}

export function minutesSince(sinceMs: number, nowMs: number): number {
  return Math.max(1, Math.floor((nowMs - sinceMs) / MS_PER_MINUTE));
}

export function msUntilMinuteChange(anchorMs: number, nowMs: number): number {
  const passed = (((nowMs - anchorMs) % MS_PER_MINUTE) + MS_PER_MINUTE) % MS_PER_MINUTE;

  return MS_PER_MINUTE - passed;
}
