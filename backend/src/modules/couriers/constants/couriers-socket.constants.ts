import { MS_PER_SECOND } from '../../../common/constants/time.constants';

// Couriers have their own namespace: client tracking gets another one later.
export const COURIERS_SOCKET_NAMESPACE = '/couriers';

const COURIER_ROOM_PREFIX = 'courier:';

// Every socket of a courier joins this room, so an offer reaches all their open tabs.
export function courierRoom(courierProfileId: number): string {
  return `${COURIER_ROOM_PREFIX}${courierProfileId}`;
}

// Events
export const COURIER_SOCKET_EVENTS = {
  LOCATION_UPDATE: 'location:update',
  OFFER_NEW: 'offer:new',
} as const;

// Location
// One position per 15 seconds is enough for assignment and keeps the database calm.
export const LOCATION_MIN_INTERVAL_MS = 15 * MS_PER_SECOND;

// Reasons a position is not saved: the client reads them from the acknowledgement.
export const LOCATION_UPDATE_REJECTIONS = {
  SESSION_EXPIRED: 'session_expired',
  TOO_FREQUENT: 'too_frequent',
  INVALID_LOCATION: 'invalid_location',
  OFF_SHIFT: 'off_shift',
  BUSY: 'busy',
} as const;
