import { MS_PER_SECOND } from '@/shared/config';

// The position asked for before going on the line: a fresh one, or the courier waits too long.
export const CURRENT_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10 * MS_PER_SECOND,
  maximumAge: 30 * MS_PER_SECOND,
};

// The position followed while the courier is on the line.
export const WATCH_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
};

// Why the browser gave no position: the courier denied it, or it could not be found.
export const GEO_PROBLEM = {
  DENIED: 'denied',
  FAILED: 'failed',
} as const;

export type GeoProblem = (typeof GEO_PROBLEM)[keyof typeof GEO_PROBLEM];
