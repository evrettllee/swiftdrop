import { z } from 'zod';
import { http } from '@/shared/api';

export const SUPPORT_STAFF_API_PATHS = {
  COUNTS: '/manager/support/counts',
} as const;

export {
  SUPPORT_TICKET_STATUS,
  type SupportTicketStatus,
  supportTicketStatusSchema,
} from '@/shared/api';

export const supportCountsSchema = z.object({
  awaiting: z.number(),
  open: z.number(),
});

export type SupportCounts = z.infer<typeof supportCountsSchema>;

export async function getSupportCounts(signal?: AbortSignal): Promise<SupportCounts> {
  return supportCountsSchema.parse(await http.get(SUPPORT_STAFF_API_PATHS.COUNTS, { signal }));
}
