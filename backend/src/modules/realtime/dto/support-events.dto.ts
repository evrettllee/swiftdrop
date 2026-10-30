import { z } from 'zod';
import { SUPPORT_TICKET_STATUS_VALUES } from '@/common/enums/support-ticket.enum';
import {
  SUPPORT_READ_BY_VALUES,
  SUPPORT_TICKET_EVENT_KIND_VALUES,
} from '../constants/socket-events.constants';
import type {
  SupportMessageEvent,
  SupportReadEvent,
  SupportTicketEvent,
} from '../types/realtime.types';

const ticketId = z.number().int().positive();

export const supportMessageEventSchema = z.strictObject({
  ticketId,
  message: z.strictObject({
    id: z.number().int().positive(),
    text: z.string(),
    createdAt: z.iso.datetime(),
    fromStaff: z.boolean(),
    authorName: z.string(),
    isRead: z.boolean(),
  }),
}) satisfies z.ZodType<SupportMessageEvent>;

export const supportReadEventSchema = z.strictObject({
  ticketId,
  by: z.enum(SUPPORT_READ_BY_VALUES),
}) satisfies z.ZodType<SupportReadEvent>;

export const supportTicketEventSchema = z.strictObject({
  ticketId,
  kind: z.enum(SUPPORT_TICKET_EVENT_KIND_VALUES),
  awaitingStaff: z.boolean(),
  status: z.enum(SUPPORT_TICKET_STATUS_VALUES),
}) satisfies z.ZodType<SupportTicketEvent>;
