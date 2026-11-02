import { MS_PER_MINUTE, MS_PER_SECOND } from '@/shared/config';

export function minutesUntil(target: Date, nowMs: number): number {
  return Math.max(1, Math.ceil((target.getTime() - nowMs) / MS_PER_MINUTE));
}

export function minutesSince(since: Date, nowMs: number): number {
  return Math.max(1, Math.floor((nowMs - since.getTime()) / MS_PER_MINUTE));
}

export function secondsToMinutes(seconds: number): number {
  return Math.max(1, Math.ceil((seconds * MS_PER_SECOND) / MS_PER_MINUTE));
}
