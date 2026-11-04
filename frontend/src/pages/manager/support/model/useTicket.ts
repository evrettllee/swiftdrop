import { useEffect } from 'react';
import {
  onTypedSocketEvent,
  SOCKET_EVENTS,
  SUPPORT_TICKET_EVENT_KIND,
  useTicketRoom,
} from '@/shared/realtime';
import {
  getManagerOrder,
  type ManagerOrderDetails,
  SUPPORT_TICKET_STATUS,
} from '@/shared/staff-api';
import { getSupportTicket, type SupportTicket } from '@/shared/support-api';
import { DIALOG_TEXTS } from '../config/dialog-texts';
import { lastAuthorMessageId } from '../lib/messages';
import { useLoad } from './useLoad';
import { useTicketClose } from './useTicketClose';
import { useTicketMessages } from './useTicketMessages';
import { useTicketRead } from './useTicketRead';
import { useTicketSend } from './useTicketSend';

function useOrderDetails(orderId: number | null) {
  return useLoad<ManagerOrderDetails>(
    orderId === null ? null : String(orderId),
    (signal) =>
      orderId === null
        ? Promise.reject(new Error('No order'))
        : getManagerOrder(orderId, { signal }),
    DIALOG_TEXTS.LOAD_FAILED,
  );
}

function useClosedEvent(ticketId: number, reload: () => void): void {
  useEffect(
    () =>
      onTypedSocketEvent(SOCKET_EVENTS.SUPPORT_TICKET, (payload) => {
        if (payload.ticketId === ticketId && payload.kind === SUPPORT_TICKET_EVENT_KIND.CLOSED) {
          reload();
        }
      }),
    [ticketId, reload],
  );
}

export function useTicket(ticketId: number, onChanged: () => void) {
  const details = useLoad<SupportTicket>(
    String(ticketId),
    (signal) => getSupportTicket(ticketId, { signal }),
    DIALOG_TEXTS.LOAD_FAILED,
  );
  const ticket = details.data;
  const order = useOrderDetails(ticket?.order?.orderId ?? null);
  const room = useTicketRoom(ticketId);
  const thread = useTicketMessages(ticketId, room.joins);
  const { reload, replace } = details;

  useClosedEvent(ticketId, reload);
  useTicketRead(ticketId, lastAuthorMessageId(thread.messages), ticket !== null && !room.isRefused);

  const send = useTicketSend({ ticketId, onSent: thread.add, onClosed: reload });
  const close = useTicketClose(ticketId, (closed) => {
    replace(closed);
    onChanged();
  });

  return {
    details,
    ticket,
    order: order.data,
    isRefused: room.isRefused,
    isOpen: ticket?.status === SUPPORT_TICKET_STATUS.OPEN && !room.isRefused,
    thread,
    send,
    close,
  };
}

export type TicketModel = ReturnType<typeof useTicket>;
