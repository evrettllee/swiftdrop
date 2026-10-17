import { MS_PER_MINUTE, MS_PER_SECOND } from '@/shared/config';

// The position asked for before going on the line (and by «Проверить ещё раз»), in two tries.
// The first one asks for a precise position, or a recent one the browser already has.
export const FIRST_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  // A device with GPS answers in a few seconds.
  timeout: 10 * MS_PER_SECOND,
  maximumAge: MS_PER_MINUTE,
};

// The second try, after a timeout or no position: a laptop without GPS finds itself by the network,
// which is rough and slower, and a position up to 5 minutes old is still the right district.
export const FALLBACK_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15 * MS_PER_SECOND,
  maximumAge: 5 * MS_PER_MINUTE,
};

// The position followed while the courier is on the line, precise at first. Its gaps do not stop
// the work: the last position keeps being sent while it is fresh.
export const WATCH_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  // No precise position this long from the start means the device has no GPS fix (a laptop): the
  // watch goes on in the rough mode instead, for the rest of this visit of the line. After a first
  // precise position a timeout is only a pause and changes nothing.
  timeout: 30 * MS_PER_SECOND,
};

// The rough watch after the precise one timed out before its first position: the network position
// of a laptop.
// Its own timeouts are not errors any more.
export const WATCH_FALLBACK_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 0,
};

// How long the last position received from the browser is sent again: the backend counts a
// position fresh for 2 minutes too (COURIER_LOCATION_FRESH_MS in backend/src/modules/assignment).
// After that the courier sees that the position is lost.
export const POSITION_FRESH_MS = 2 * MS_PER_MINUTE;

// Why the browser gave no position: the courier denied it, or it could not be found.
export const GEO_PROBLEM = {
  DENIED: 'denied',
  FAILED: 'failed',
} as const;

export type GeoProblem = (typeof GEO_PROBLEM)[keyof typeof GEO_PROBLEM];
