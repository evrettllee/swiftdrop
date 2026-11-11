import { ConflictException, HttpStatus } from '@nestjs/common';
import { and, eq, ne, type SQL, sql } from 'drizzle-orm';
import {
  type AccessibleTicket,
  isTicketStaff,
  type TicketActor,
} from '@/common/database/ticket-access';
import { messages } from '@/database/schema';
import { SUPPORT_READ_BY } from '@/modules/realtime/constants/socket-events.constants';
import type { SupportReadBy } from '@/modules/realtime/types/realtime.types';
import { SUPPORT_ERROR_CODE, SUPPORT_MESSAGES } from '../constants/support.constants';
import type { MessageViewer } from '../types/support.types';

export function viewerOf(actor: TicketActor): MessageViewer {
  return isTicketStaff(actor.role) ? 'staff' : 'author';
}

export function readerOf(actor: TicketActor): SupportReadBy {
  return isTicketStaff(actor.role) ? SUPPORT_READ_BY.STAFF : SUPPORT_READ_BY.AUTHOR;
}

export function unreadFor(actor: TicketActor, ticket: AccessibleTicket): SQL {
  const fromAuthor = isTicketStaff(actor.role);

  return (
    and(
      eq(messages.ticketId, ticket.ticketId),
      fromAuthor ? eq(messages.senderId, ticket.userId) : ne(messages.senderId, ticket.userId),
      eq(messages.isRead, false),
    ) ?? sql`false`
  );
}

export function ticketClosedError(): ConflictException {
  return new ConflictException({
    statusCode: HttpStatus.CONFLICT,
    code: SUPPORT_ERROR_CODE.TICKET_CLOSED,
    message: SUPPORT_MESSAGES.TICKET_CLOSED,
  });
}
