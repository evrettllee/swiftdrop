import { Injectable } from '@nestjs/common';
import {
  SOCKET_EVENTS,
  SUPPORT_TICKET_EVENT_KIND,
} from '@/modules/realtime/constants/socket-events.constants';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import type {
  SupportMessageEvent,
  SupportReadBy,
  SupportReadEvent,
  SupportTicketEvent,
  SupportTicketEventKind,
} from '@/modules/realtime/types/realtime.types';
import { toTicketMessage } from '../mappers/support.mapper';
import type { SupportPendingEvent, SupportTicketState } from '../types/support.types';

type TicketSummary = {
  ticket: SupportTicketState;
  kind: SupportTicketEventKind;
  staffReplied: boolean;
};

const KIND_WEIGHT: Record<SupportTicketEventKind, number> = {
  [SUPPORT_TICKET_EVENT_KIND.MESSAGE]: 0,
  [SUPPORT_TICKET_EVENT_KIND.CLOSED]: 1,
  [SUPPORT_TICKET_EVENT_KIND.CREATED]: 2,
};

export function summarizeTickets(pending: readonly SupportPendingEvent[]): TicketSummary[] {
  const summaries = new Map<number, TicketSummary>();

  for (const event of pending) {
    const previous = summaries.get(event.ticket.ticketId);
    const kind =
      previous && KIND_WEIGHT[previous.kind] > KIND_WEIGHT[event.kind] ? previous.kind : event.kind;
    const staffReply = event.kind === 'message' && event.fromStaff;

    summaries.set(event.ticket.ticketId, {
      ticket: event.ticket,
      kind,
      staffReplied: (previous?.staffReplied ?? false) || staffReply,
    });
  }

  return [...summaries.values()];
}

@Injectable()
export class SupportEventsService {
  constructor(private readonly events: RealtimeEventsService) {}

  publish(pending: readonly SupportPendingEvent[]): void {
    for (const event of pending) {
      if (event.kind === 'message' && !pending.some((other) => other.kind === 'created')) {
        this.publishMessage(event);
      }
    }

    for (const summary of summarizeTickets(pending)) {
      this.publishTicket(summary);
    }
  }

  read(ticketId: number, by: SupportReadBy): void {
    const event: SupportReadEvent = { ticketId, by };

    this.events.toTicket(ticketId, SOCKET_EVENTS.SUPPORT_READ, event);
  }

  private publishMessage(event: Extract<SupportPendingEvent, { kind: 'message' }>): void {
    const { ticket, message, fromStaff } = event;
    const forAuthor: SupportMessageEvent = {
      ticketId: ticket.ticketId,
      message: toTicketMessage(message, ticket.userId, 'author'),
    };

    if (!fromStaff) {
      this.events.toTicket(ticket.ticketId, SOCKET_EVENTS.SUPPORT_MESSAGE, forAuthor);

      return;
    }

    const forStaff: SupportMessageEvent = {
      ticketId: ticket.ticketId,
      message: toTicketMessage(message, ticket.userId, 'staff'),
    };

    this.events.toTicket(ticket.ticketId, SOCKET_EVENTS.SUPPORT_MESSAGE, forAuthor, {
      exceptStaff: true,
    });
    this.events.toTicket(ticket.ticketId, SOCKET_EVENTS.SUPPORT_MESSAGE, forStaff, {
      exceptUserId: ticket.userId,
    });
  }

  private publishTicket({ ticket, kind, staffReplied }: TicketSummary): void {
    const event: SupportTicketEvent = {
      ticketId: ticket.ticketId,
      kind,
      awaitingStaff: ticket.awaitingStaff,
      status: ticket.status,
    };

    this.events.toStaff(SOCKET_EVENTS.SUPPORT_TICKET, event);

    if (kind === SUPPORT_TICKET_EVENT_KIND.CLOSED || staffReplied) {
      this.events.toUser(ticket.userId, SOCKET_EVENTS.SUPPORT_TICKET, event);
    }
  }
}
