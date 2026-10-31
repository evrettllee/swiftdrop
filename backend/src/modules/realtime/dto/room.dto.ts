import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';

// The body of order:join and order:leave. A socket message keeps its JSON types, so the id is a
// number, never coerced; any other field makes the body invalid.
export const orderRoomBodySchema = z.strictObject({
  orderId: z.number().int().positive().max(DB_INTEGER_MAX),
});

export type OrderRoomBody = z.infer<typeof orderRoomBodySchema>;

export const ticketRoomBodySchema = z.strictObject({
  ticketId: z.number().int().positive().max(DB_INTEGER_MAX),
});
