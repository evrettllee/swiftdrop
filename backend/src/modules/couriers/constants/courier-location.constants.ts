import { MS_PER_SECOND } from '@/common/constants/time.constants';

// One position per 5 seconds per courier: the client follows the courier on the map, and the
// database still takes at most one write per courier in that time. The same value filters a
// socket before the query and limits the courier in the query, whatever sockets they have open.
export const LOCATION_MIN_INTERVAL_MS = 5 * MS_PER_SECOND;

// Reasons a position is not saved: the client reads them from the acknowledgement.
export const LOCATION_UPDATE_REJECTIONS = {
  // The socket is not a courier's: only couriers send positions.
  FORBIDDEN: 'forbidden',
  // The account was blocked after the socket opened: the socket is closed after this answer.
  UNAUTHORIZED: 'unauthorized',
  SESSION_EXPIRED: 'session_expired',
  TOO_FREQUENT: 'too_frequent',
  INVALID_LOCATION: 'invalid_location',
  OFF_SHIFT: 'off_shift',
  BUSY: 'busy',
  // The position could not be saved for an unexpected reason; the next one may succeed.
  UNAVAILABLE: 'unavailable',
} as const;
