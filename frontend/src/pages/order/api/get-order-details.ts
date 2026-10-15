import {
  http,
  type HttpOptions,
  type OrderDetails,
  orderDetailsSchema,
  ORDERS_API_PATHS,
} from '@/shared/api';

export async function getOrderDetails(
  orderId: number,
  options: HttpOptions = {},
): Promise<OrderDetails> {
  return orderDetailsSchema.parse(
    await http.get(`${ORDERS_API_PATHS.ORDERS}/${orderId}`, options),
  );
}
