import { z } from 'zod';
import {
  dateSchema,
  http,
  ORDERS_API_PATHS,
  orderStatusSchema,
  type PackageParams,
} from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';

// Response of POST /api/orders
const createdOrderSchema = z.object({
  orderId: z.number(),
  status: orderStatusSchema,
  price: z.number(),
  currency: z.string(),
  estimatedDeliveryAt: dateSchema,
});

type CreatedOrder = z.infer<typeof createdOrderSchema>;

export type OrderAddressInput = GeoPoint & {
  city: string;
  street: string;
  house: string;
  apartment?: string;
};

// The body of POST /api/orders: the price is not sent, the server calculates it.
export type CreateOrderInput = {
  pickup: OrderAddressInput;
  delivery: OrderAddressInput;
  recipient: { name: string; phone: string };
  package: PackageParams;
};

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  return createdOrderSchema.parse(await http.post(ORDERS_API_PATHS.ORDERS, input));
}
