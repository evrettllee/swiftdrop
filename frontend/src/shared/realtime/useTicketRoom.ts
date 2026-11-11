import { useEffect, useSyncExternalStore } from 'react';
import { connectAppSocket } from './app-socket';
import {
  enterTicketRoom,
  getTicketRoomState,
  subscribeTicketRooms,
  type TicketRoomState,
} from './ticket-room';

const NO_TICKET: TicketRoomState = { joins: 0, isRefused: false };

export function useTicketRoom(ticketId: number | null): TicketRoomState {
  const state = useSyncExternalStore(subscribeTicketRooms, () =>
    ticketId === null ? NO_TICKET : getTicketRoomState(ticketId),
  );

  useEffect(() => {
    if (ticketId === null) {
      return undefined;
    }

    const release = connectAppSocket();
    const leave = enterTicketRoom(ticketId);

    return () => {
      leave();
      release();
    };
  }, [ticketId]);

  return state;
}
