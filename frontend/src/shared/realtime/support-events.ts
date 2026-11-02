import { z } from 'zod';
import { dateSchema, supportTicketStatusSchema } from '@/shared/api';
import { SOCKET_EVENTS } from './socket-events';

export const SUPPORT_TICKET_EVENT_KIND = {
  CREATED: 'created',
  MESSAGE: 'message',
  CLOSED: 'closed',
} as const;

export const SUPPORT_READ_BY = {
  AUTHOR: 'author',
  STAFF: 'staff',
} as const;

export const SUPPORT_EVENT_SCHEMAS = {
  [SOCKET_EVENTS.SUPPORT_MESSAGE]: z.object({
    ticketId: z.number(),
    message: z.object({
      id: z.number(),
      text: z.string(),
      createdAt: dateSchema,
      fromStaff: z.boolean(),
      authorName: z.string(),
      isRead: z.boolean(),
    }),
  }),
  [SOCKET_EVENTS.SUPPORT_READ]: z.object({
    ticketId: z.number(),
    by: z.enum(SUPPORT_READ_BY),
  }),
  [SOCKET_EVENTS.SUPPORT_TICKET]: z.object({
    ticketId: z.number(),
    kind: z.enum(SUPPORT_TICKET_EVENT_KIND),
    awaitingStaff: z.boolean(),
    status: supportTicketStatusSchema,
  }),
};
