import { GLOBAL_PREFIX } from '@/common/constants/http.constants';
import { MS_PER_SECOND } from '@/common/constants/time.constants';
import { ROLE } from '@/common/enums/role.enum';

// Under the API prefix, because the session cookie is only sent to /api.
export const SOCKET_PATH = `/${GLOBAL_PREFIX}/socket.io`;

// Every role connects to this one namespace; what each of them gets is decided by the rooms they
// are in.
export const APP_SOCKET_NAMESPACE = '/couriers';

export const STAFF_ROLES = [ROLE.MANAGER, ROLE.ADMIN] as const;

// Only these roles may open a socket; any other gets the same refusal as a missing session.
export const SOCKET_ROLES = [ROLE.COURIER, ROLE.CLIENT, ...STAFF_ROLES] as const;

// Reasons a connection is refused: the client reads them from connect_error.message.
export const SOCKET_ERRORS = {
  UNAUTHORIZED: 'unauthorized',
  ORIGIN_NOT_ALLOWED: 'origin_not_allowed',
} as const;

// Rooms
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

const TICKET_ROOM_PREFIX = 'ticket:';

export function ticketRoom(ticketId: number): string {
  return `${TICKET_ROOM_PREFIX}${ticketId}`;
}

export function isTicketRoom(room: string): boolean {
  return room.startsWith(TICKET_ROOM_PREFIX);
}

export const TICKET_ROOMS_MAX_PER_SOCKET = 5;

export const STAFF_ROOM = 'staff';

// Heartbeat
// A lost connection is noticed in about 15 seconds (ping interval + ping timeout) instead of the
// 45 of socket.io by default: the cabinet tells the courier sooner that offers stopped.
export const SOCKET_PING_INTERVAL_MS = 10 * MS_PER_SECOND;
export const SOCKET_PING_TIMEOUT_MS = 5 * MS_PER_SECOND;

// The largest message a socket may send. The bodies of the app are a few dozen bytes; a bigger
// message closes the socket before it is parsed (socket.io allows 1 MB by default).
export const SOCKET_MAX_PAYLOAD_BYTES = 16 * 1024;

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

// Session
// The longest delay setTimeout takes: a bigger one fires at once.
export const SET_TIMEOUT_MAX_MS = 2 ** 31 - 1;

// Cookie header
export const COOKIE_PAIR_SEPARATOR = ';';
export const COOKIE_NAME_VALUE_SEPARATOR = '=';
