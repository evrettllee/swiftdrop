import { z } from 'zod';
import { http } from '../http';

export const SUPPORT_STAFF_API_PATHS = {
  COUNTS: '/manager/support/counts',
} as const;

export const SUPPORT_TICKET_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
} as const;

export type SupportTicketStatus =
  (typeof SUPPORT_TICKET_STATUS)[keyof typeof SUPPORT_TICKET_STATUS];

export const supportTicketStatusSchema = z.enum(SUPPORT_TICKET_STATUS);

export const supportCountsSchema = z.object({
  awaiting: z.number(),
  open: z.number(),
});

export type SupportCounts = z.infer<typeof supportCountsSchema>;

export async function getSupportCounts(signal?: AbortSignal): Promise<SupportCounts> {
  return supportCountsSchema.parse(await http.get(SUPPORT_STAFF_API_PATHS.COUNTS, { signal }));
}
