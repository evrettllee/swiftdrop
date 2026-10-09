import { http, type OrderDetails, orderDetailsSchema, ORDERS_API_PATHS } from '@/shared/api';

export async function getOrderDetails(orderId: number): Promise<OrderDetails> {
  return orderDetailsSchema.parse(await http.get(`${ORDERS_API_PATHS.ORDERS}/${orderId}`));
}
