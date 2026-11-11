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
  joins: number;
  isRefused: boolean;
  hasRefreshed: boolean;
  retryTimer: number | undefined;
  retryDelayMs: number;
  attempt: number;
};

export type TicketRoomState = { joins: number; isRefused: boolean };

const NO_ROOM: TicketRoomState = { joins: 0, isRefused: false };

const rooms = new Map<number, Room>();
const snapshots = new Map<number, TicketRoomState>();
const listeners = new Set<() => void>();
let stopRejoining: (() => void) | null = null;

function publish(ticketId: number, room: Room): void {
  snapshots.set(ticketId, { joins: room.joins, isRefused: room.isRefused });
  listeners.forEach((listener) => listener());
}

function applyOutcome(ticketId: number, room: Room, current: Socket, outcome: JoinOutcome): void {
  if (outcome === JOIN_OUTCOME.JOINED) {
    room.joins += 1;
    room.retryDelayMs = 0;
    room.hasRefreshed = false;
    publish(ticketId, room);
  } else if (outcome === JOIN_OUTCOME.RETRY) {
    room.retryDelayMs = nextJoinDelay(room.retryDelayMs);
    room.retryTimer = window.setTimeout(() => void requestJoin(ticketId), room.retryDelayMs);
  } else if (outcome === JOIN_OUTCOME.REFRESH && !room.hasRefreshed) {
    room.hasRefreshed = true;
    current.disconnect();
    void reconnectWithFreshSession(current);
  } else if (outcome === JOIN_OUTCOME.CLOSE) {
    closeRefusedSocket(current);
  } else if (outcome === JOIN_OUTCOME.REFUSED) {
    room.isRefused = true;
    publish(ticketId, room);
  }
}

async function requestJoin(ticketId: number): Promise<void> {
  const room = rooms.get(ticketId);
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
      .emitWithAck(SOCKET_EVENTS.TICKET_JOIN, { ticketId });
    ack = orderJoinAckSchema.parse(answer);
  } catch {
    ack = null;
  }

  if (rooms.get(ticketId) === room && room.attempt === attempt && current.connected) {
    applyOutcome(ticketId, room, current, toJoinOutcome(ack));
  }
}

export function enterTicketRoom(ticketId: number): () => void {
  stopRejoining ??= onSocketConnect(() => {
    rooms.forEach((_, roomTicketId) => void requestJoin(roomTicketId));
  });

  const room: Room = {
    joins: 0,
    isRefused: false,
    hasRefreshed: false,
    retryTimer: undefined,
    retryDelayMs: 0,
    attempt: 0,
  };
  rooms.set(ticketId, room);
  publish(ticketId, room);
  void requestJoin(ticketId);

  return () => {
    if (rooms.get(ticketId) !== room) {
      return;
    }

    window.clearTimeout(room.retryTimer);
    rooms.delete(ticketId);
    snapshots.delete(ticketId);
    getConnectedSocket()?.emit(SOCKET_EVENTS.TICKET_LEAVE, { ticketId });
    listeners.forEach((listener) => listener());
  };
}

export function getTicketRoomState(ticketId: number): TicketRoomState {
  return snapshots.get(ticketId) ?? NO_ROOM;
}

export function subscribeTicketRooms(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
