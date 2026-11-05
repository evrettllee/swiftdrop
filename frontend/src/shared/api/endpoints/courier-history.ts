import { z } from 'zod';
import { http } from '../http';
import { COURIER_ORDERS_API_PATHS } from './courier-order';
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
export const courierHistorySummarySchema = z.object({
  count: z.number(),
  distanceKm: z.number(),
});

export type CourierHistorySummary = z.infer<typeof courierHistorySummarySchema>;

export const courierHistoryPageSchema = z.object({
  items: z.array(courierHistoryItemSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  until: z.number().nullable(),
  summary: courierHistorySummarySchema.optional(),
});

export type CourierHistoryPage = z.infer<typeof courierHistoryPageSchema>;

export const courierHistoryCursorPageSchema = z.object({
  items: z.array(courierHistoryItemSchema),
  nextCursor: z.string().nullable(),
  total: z.number().optional(),
  summary: courierHistorySummarySchema.optional(),
});

export type CourierHistoryCursorPage = z.infer<typeof courierHistoryCursorPageSchema>;

const pointSchema = z.object({
  city: z.string(),
  street: z.string(),
  house: z.string(),
  apartment: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

// Response of GET /api/couriers/me/orders/:orderId: a finished order without the people of it.
export const courierHistoryOrderSchema = z.object({
  orderId: z.number(),
  status: orderStatusSchema,
  finishedAt: dateSchema.nullable(),
  pickup: pointSchema,
  delivery: pointSchema,
  parcel: z.object({
    weightKg: z.number(),
    lengthCm: z.number(),
    widthCm: z.number(),
    heightCm: z.number(),
    isFragile: z.boolean(),
  }),
  distanceKm: z.number(),
  history: z.array(z.object({ status: orderStatusSchema, changedAt: dateSchema })),
});

export type CourierHistoryOrder = z.infer<typeof courierHistoryOrderSchema>;

export async function getCourierHistoryOrder(
  orderId: number,
  signal?: AbortSignal,
): Promise<CourierHistoryOrder> {
  return courierHistoryOrderSchema.parse(
    await http.get(COURIER_ORDERS_API_PATHS.historyOrder(orderId), { signal }),
  );
}
