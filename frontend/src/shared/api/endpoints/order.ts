import { z } from 'zod';
import { PAYMENT_STATUS } from './payment';

export const ORDERS_API_PATHS = {
  ORDERS: '/orders',
  courier: (orderId: number) => `/orders/${orderId}/courier`,
} as const;

export const ORDER_CANCEL_SEGMENT = 'cancel';

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  AWAITING_MANUAL_ASSIGNMENT: 'awaiting_manual_assignment',
  COURIER_ASSIGNED: 'courier_assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const orderStatusSchema = z.enum(ORDER_STATUS);
const paymentStatusSchema = z.enum(PAYMENT_STATUS);

// Dates arrive as ISO strings.
export const dateSchema = z.coerce.date();

const addressSchema = z.object({
  city: z.string(),
  street: z.string(),
  house: z.string(),
  apartment: z.string().nullable(),
});

const pointSchema = addressSchema.extend({
  latitude: z.number(),
  longitude: z.number(),
});

export const orderListItemSchema = z.object({
  orderId: z.number(),
  status: orderStatusSchema,
  price: z.number(),
  currency: z.string(),
  createdAt: dateSchema,
  estimatedDeliveryAt: dateSchema.nullable(),
  pickup: addressSchema,
  delivery: addressSchema,
});

export type OrderListItem = z.infer<typeof orderListItemSchema>;

// Response of GET /api/orders/:orderId
export const orderDetailsSchema = z.object({
  orderId: z.number(),
  status: orderStatusSchema,
  price: z.number(),
  currency: z.string(),
  priceCoefficient: z.number(),
  distanceKm: z.number(),
  // The time of the trip given at the placement, in minutes: it stays the same while the arrival
  // estimate moves estimatedDeliveryAt. Null for orders placed before the backend kept it.
  estimatedMinutes: z.number().nullable(),
  estimatedDeliveryAt: dateSchema.nullable(),
  createdAt: dateSchema,
  recipient: z.object({ name: z.string(), phone: z.string() }),
  parcel: z.object({
    weightKg: z.number(),
    lengthCm: z.number(),
    widthCm: z.number(),
    heightCm: z.number(),
    isFragile: z.boolean(),
  }),
  pickup: pointSchema,
  delivery: pointSchema,
  history: z.array(z.object({ status: orderStatusSchema, changedAt: dateSchema })),
  payment: z.object({ status: paymentStatusSchema, amountUsd: z.number() }).nullable(),
});

export type OrderDetails = z.infer<typeof orderDetailsSchema>;
