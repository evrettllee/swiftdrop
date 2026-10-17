import { z } from 'zod';
import { orderStatusSchema } from './order';

const COURIER_ORDERS_PATH = '/couriers/me/orders';

export const COURIER_ORDERS_API_PATHS = {
  CURRENT: `${COURIER_ORDERS_PATH}/current`,
  HISTORY: `${COURIER_ORDERS_PATH}/history`,
  historyOrder: (orderId: number) => `${COURIER_ORDERS_PATH}/${orderId}`,
  pickup: (orderId: number) => `${COURIER_ORDERS_PATH}/${orderId}/pickup`,
  depart: (orderId: number) => `${COURIER_ORDERS_PATH}/${orderId}/depart`,
  deliver: (orderId: number) => `${COURIER_ORDERS_PATH}/${orderId}/deliver`,
} as const;

// After the accept the courier sees the exact address of both points.
const courierOrderPointSchema = z.object({
  city: z.string(),
  street: z.string(),
  house: z.string(),
  apartment: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

// The order the courier carries (the CourierOrder of the backend). The sender is the client who
// placed it and may have no phone.
export const courierOrderSchema = z.object({
  orderId: z.number(),
  status: orderStatusSchema,
  pickup: courierOrderPointSchema,
  delivery: courierOrderPointSchema,
  sender: z.object({ name: z.string(), phone: z.string().nullable() }),
  recipient: z.object({ name: z.string(), phone: z.string() }),
  parcel: z.object({
    weightKg: z.number(),
    lengthCm: z.number(),
    widthCm: z.number(),
    heightCm: z.number(),
    isFragile: z.boolean(),
  }),
  distanceKm: z.number(),
});

export type CourierOrder = z.infer<typeof courierOrderSchema>;

// Response of GET /api/couriers/me/orders/current
export const currentCourierOrderSchema = z.object({ order: courierOrderSchema.nullable() });
