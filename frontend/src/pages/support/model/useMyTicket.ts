import { useEffect } from 'react';
import {
  lastIncomingMessageId,
  useSupportRead,
  useSupportSend,
  useSupportThread,
} from '@/features/support-thread';
import { useLoad } from '@/shared/lib/async';
import { onTypedSocketEvent, SOCKET_EVENTS, useTicketRoom } from '@/shared/realtime';
import { SUPPORT_TICKET_STATUS } from '@/shared/staff-api';
import {
  getMyTicket,
  type MyTicket,
  SUPPORT_SIDE,
  type SupportMessage,
} from '@/shared/support-api';
import { THREAD_TEXTS } from '../config/thread-texts';

function useTicketEvents(ticketId: number, reload: () => void): void {
  useEffect(
    () =>
      onTypedSocketEvent(SOCKET_EVENTS.SUPPORT_TICKET, (payload) => {
        if (payload.ticketId === ticketId) {
          reload();
        }
      }),
    [ticketId, reload],
  );
}

export function useMyTicket(ticketId: number) {
  const details = useLoad<MyTicket>(
    `ticket:${ticketId}`,
    (signal) => getMyTicket(ticketId, { signal }),
    THREAD_TEXTS.LOAD_FAILED,
  );
  const ticket = details.data;
  const room = useTicketRoom(ticket === null ? null : ticketId);
  const thread = useSupportThread(SUPPORT_SIDE.AUTHOR, ticketId, room.joins);
  const { reload } = details;
  const { add } = thread;

  useTicketEvents(ticketId, reload);
  useSupportRead({
    side: SUPPORT_SIDE.AUTHOR,
    ticketId,
    lastIncomingId: lastIncomingMessageId(thread.messages, SUPPORT_SIDE.AUTHOR),
    isEnabled: ticket !== null && !room.isRefused,
  });

  const send = useSupportSend({
    side: SUPPORT_SIDE.AUTHOR,
    ticketId,
    onSent: (message: SupportMessage) => {
      add(message);
      reload();
    },
    onClosed: reload,
  });

  return {
    details,
    ticket,
    isRefused: room.isRefused,
    isOpen: ticket?.status === SUPPORT_TICKET_STATUS.OPEN && !room.isRefused,
    thread,
    send,
  };
}

export type MyTicketModel = ReturnType<typeof useMyTicket>;
