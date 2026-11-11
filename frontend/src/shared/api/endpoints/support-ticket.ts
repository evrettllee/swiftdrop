import { z } from 'zod';

export const SUPPORT_TICKET_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const;

export type SupportTicketStatus =
  (typeof SUPPORT_TICKET_STATUS)[keyof typeof SUPPORT_TICKET_STATUS];

export const supportTicketStatusSchema = z.enum(SUPPORT_TICKET_STATUS);
