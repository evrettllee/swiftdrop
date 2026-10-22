import { MS_PER_SECOND } from '../../../common/constants/time.constants';
import { ROLE } from '../../../common/enums/role.enum';

// Clients and couriers connect to this one namespace; what each of them gets is decided by the
// rooms they are in.
export const COURIERS_SOCKET_NAMESPACE = '/couriers';

// Only these roles may open a socket; any other gets the same refusal as a missing session.
export const SOCKET_ROLES = [ROLE.COURIER, ROLE.CLIENT] as const;

const COURIER_ROOM_PREFIX = 'courier:';

// Every socket of a courier joins this room, so an offer reaches all their open tabs.
export function courierRoom(courierProfileId: number): string {
  return `${COURIER_ROOM_PREFIX}${courierProfileId}`;
}

const ORDER_ROOM_PREFIX = 'order:';

// The client who owns the order and its courier join this room; events of the order go there.
export function orderRoom(orderId: number): string {
  return `${ORDER_ROOM_PREFIX}${orderId}`;
}

export function isOrderRoom(room: string): boolean {
  return room.startsWith(ORDER_ROOM_PREFIX);
}

// Heartbeat
// A lost connection is noticed in about 15 seconds (ping interval + ping timeout) instead of the
// 45 of socket.io by default: the cabinet tells the courier sooner that offers stopped.
export const COURIER_SOCKET_PING_INTERVAL_MS = 10 * MS_PER_SECOND;
export const COURIER_SOCKET_PING_TIMEOUT_MS = 5 * MS_PER_SECOND;

// Events
export const COURIER_SOCKET_EVENTS = {
  LOCATION_UPDATE: 'location:update',
  OFFER_NEW: 'offer:new',
  // The offer can no longer be accepted: its time is up, the order or the courier left.
  OFFER_CLOSED: 'offer:closed',
  // The client cancelled the order the courier was heading to.
  ORDER_CANCELLED: 'order:cancelled',
  // The owner of an order or its courier asks for the events of the order, and stops.
  ORDER_JOIN: 'order:join',
  ORDER_LEAVE: 'order:leave',
} as const;

// Order rooms
// A page shows one order; a few more cover open tabs. The personal courier room is not counted.
export const ORDER_ROOMS_MAX_PER_SOCKET = 5;
// Joins a socket may try within the window: enough for a person, too few to probe order ids.
export const ORDER_JOIN_MAX_ATTEMPTS = 20;
export const ORDER_JOIN_WINDOW_MS = 60 * MS_PER_SECOND;

// Reasons an order room is not joined: the client reads them from the acknowledgement. A foreign
// order and a missing one get the same not_found.
export const ORDER_JOIN_REJECTIONS = {
  INVALID: 'invalid',
  SESSION_EXPIRED: 'session_expired',
  TOO_FREQUENT: 'too_frequent',
  TOO_MANY_ROOMS: 'too_many_rooms',
  NOT_FOUND: 'not_found',
  // The check could not run for an unexpected reason; the next attempt may succeed.
  UNAVAILABLE: 'unavailable',
} as const;

// Location
// One position per 15 seconds is enough for assignment and keeps the database calm.
export const LOCATION_MIN_INTERVAL_MS = 15 * MS_PER_SECOND;

// Reasons a position is not saved: the client reads them from the acknowledgement.
export const LOCATION_UPDATE_REJECTIONS = {
  // The socket is not a courier's: only couriers send positions.
  FORBIDDEN: 'forbidden',
  SESSION_EXPIRED: 'session_expired',
  TOO_FREQUENT: 'too_frequent',
  INVALID_LOCATION: 'invalid_location',
  OFF_SHIFT: 'off_shift',
  BUSY: 'busy',
  // The position could not be saved for an unexpected reason; the next one may succeed.
  UNAVAILABLE: 'unavailable',
} as const;
