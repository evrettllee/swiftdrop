import { z } from 'zod';
import { http, ORDER_CANCEL_SEGMENT, ORDERS_API_PATHS, orderStatusSchema } from '@/shared/api';

// Response of POST /api/orders/:orderId/cancel
const cancelledOrderSchema = z.object({
  orderId: z.number(),
  status: orderStatusSchema,
});

type CancelledOrder = z.infer<typeof cancelledOrderSchema>;

export async function cancelOrder(orderId: number): Promise<CancelledOrder> {
  return cancelledOrderSchema.parse(
    await http.post(`${ORDERS_API_PATHS.ORDERS}/${orderId}/${ORDER_CANCEL_SEGMENT}`),
  );
}
