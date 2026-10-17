import { z } from 'zod';
import { dateSchema, orderStatusSchema } from './order';

// A finished order of the courier (the CourierHistoryItem of the backend). `finishedAt` is null
// for an order whose final status was written without its history.
export const courierHistoryItemSchema = z.object({
  orderId: z.number(),
  status: orderStatusSchema,
  finishedAt: dateSchema.nullable(),
  pickup: z.object({ street: z.string(), house: z.string() }),
  delivery: z.object({ street: z.string(), house: z.string() }),
  distanceKm: z.number(),
  weightKg: z.number(),
});

export type CourierHistoryItem = z.infer<typeof courierHistoryItemSchema>;

// Response of GET /api/couriers/me/orders/history
export const courierHistoryPageSchema = z.object({
  items: z.array(courierHistoryItemSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});
