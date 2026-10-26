import type { Socket } from 'socket.io-client';
import {
  closeRefusedSocket,
  getConnectedSocket,
  onSocketConnect,
  reconnectWithFreshSession,
} from './app-socket';
import {
  JOIN_OUTCOME,
  type JoinOutcome,
  nextJoinDelay,
  ORDER_JOIN_ACK_TIMEOUT_MS,
  type OrderJoinAck,
  orderJoinAckSchema,
  toJoinOutcome,
} from './order-join';
import { SOCKET_EVENTS } from './socket-events';

type Room = {
  // The parts of the app that want the events of the order, for example the cabinet of the courier.
  owners: number;
  // Joins the backend acknowledged since the room was entered: 1 after the first, more after each
  // lost connection.
  joins: number;
  retryTimer: number | undefined;
  retryDelayMs: number;
  // The session was refreshed for this room since its last join: a second expiry gives up.
  hasRefreshed: boolean;
  // A foreign or missing order: it is not asked again while the room is entered.
  isRefused: boolean;
  // Grows with every request, so the late answer of an older one is dropped.
  attempt: number;
};

const rooms = new Map<number, Room>();
const listeners = new Set<() => void>();
let stopRejoining: (() => void) | null = null;

function notify(): void {
  listeners.forEach((listener) => listener());
}

function applyOutcome(orderId: number, room: Room, current: Socket, outcome: JoinOutcome): void {
  if (outcome === JOIN_OUTCOME.JOINED) {
    room.joins += 1;
    room.retryDelayMs = 0;
    room.hasRefreshed = false;
    notify();
  } else if (outcome === JOIN_OUTCOME.RETRY) {
    room.retryDelayMs = nextJoinDelay(room.retryDelayMs);
    room.retryTimer = window.setTimeout(() => void requestJoin(orderId), room.retryDelayMs);
  } else if (outcome === JOIN_OUTCOME.REFRESH && !room.hasRefreshed) {
    // Once: the socket opens again with a refreshed session and every room joins on its connect.
    room.hasRefreshed = true;
    current.disconnect();
    void reconnectWithFreshSession(current);
  } else if (outcome === JOIN_OUTCOME.CLOSE) {
    closeRefusedSocket(current);
  } else if (outcome === JOIN_OUTCOME.REFUSED) {
    room.isRefused = true;
  }
}

// Asks the backend to let the socket into the room of the order. Without a connection nothing is
// sent: the next connect asks for every room.
async function requestJoin(orderId: number): Promise<void> {
  const room = rooms.get(orderId);
  const current = getConnectedSocket();

  if (room === undefined || room.isRefused || current === null) {
    return;
  }

  window.clearTimeout(room.retryTimer);
  room.attempt += 1;
  const { attempt } = room;
  let ack: OrderJoinAck | null = null;

  try {
    const answer: unknown = await current
      .timeout(ORDER_JOIN_ACK_TIMEOUT_MS)
      .emitWithAck(SOCKET_EVENTS.ORDER_JOIN, { orderId });
    ack = orderJoinAckSchema.parse(answer);
  } catch {
    ack = null;
  }

  // The room was left or asked again meanwhile, or the connection was lost: its connect asks again.
  if (rooms.get(orderId) === room && room.attempt === attempt && current.connected) {
    applyOutcome(orderId, room, current, toJoinOutcome(ack));
  }
}

function leaveRoom(orderId: number, room: Room): void {
  room.owners -= 1;

  if (room.owners > 0) {
    return;
  }

  window.clearTimeout(room.retryTimer);
  rooms.delete(orderId);
  getConnectedSocket()?.emit(SOCKET_EVENTS.ORDER_LEAVE, { orderId });
  notify();
}

// Adds an owner of the room of the order; the first one joins it. The backend forgets the rooms of
// a lost connection, so every connect joins all of them again. The returned function removes the
// owner (a second call changes nothing); the last one leaves the room.
export function enterOrderRoom(orderId: number): () => void {
  stopRejoining ??= onSocketConnect(() => {
    rooms.forEach((_, roomOrderId) => void requestJoin(roomOrderId));
  });

  let room = rooms.get(orderId);

  if (room === undefined) {
    room = {
      owners: 0,
      joins: 0,
      retryTimer: undefined,
      retryDelayMs: 0,
      hasRefreshed: false,
      isRefused: false,
      attempt: 0,
    };
    rooms.set(orderId, room);
    void requestJoin(orderId);
  }

  room.owners += 1;
  const entered = room;
  let isLeft = false;

  return () => {
    if (!isLeft) {
      isLeft = true;
      leaveRoom(orderId, entered);
    }
  };
}

export function getOrderRoomJoins(orderId: number): number {
  return rooms.get(orderId)?.joins ?? 0;
}

export function subscribeOrderRooms(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
