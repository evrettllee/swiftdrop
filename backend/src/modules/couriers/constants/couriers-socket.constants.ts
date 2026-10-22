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

const USER_ROOM_PREFIX = 'user:';

// Every socket of a user joins this room, whatever the role, so all of them can be closed at once.
export function userRoom(userId: number): string {
  return `${USER_ROOM_PREFIX}${userId}`;
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

// The largest message a socket may send. The bodies of the app are a few dozen bytes; a bigger
// message closes the socket before it is parsed (socket.io allows 1 MB by default).
export const SOCKET_MAX_PAYLOAD_BYTES = 16 * 1024;

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
  // The position of the courier, sent to the room of their active order.
  COURIER_LOCATION: 'courier:location',
} as const;

// Order rooms
// A page shows one order; a few more cover open tabs. The personal courier room is not counted.
export const ORDER_ROOMS_MAX_PER_SOCKET = 5;
// Joins a socket may try within the window: enough for a person, too few to probe order ids.
export const ORDER_JOIN_MAX_ATTEMPTS = 20;
export const ORDER_JOIN_WINDOW_MS = 60 * MS_PER_SECOND;

// What the check of an order room found about the user who asks to join it.
export const PARTICIPANT_ACCESS = {
  MEMBER: 'member',
  // Not the owner of the order nor its courier, or no such order.
  OUTSIDER: 'outsider',
  // A participant whose account was blocked after the socket opened.
  BLOCKED: 'blocked',
} as const;

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
