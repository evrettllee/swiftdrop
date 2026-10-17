import {
  type ClientOrderCourier,
  clientOrderCourierSchema,
  http,
  type HttpOptions,
  ORDERS_API_PATHS,
} from '@/shared/api';

// Who carries the order and the code for them; the backend gives each only when the client may
// see it, so a missing one is not an error.
export async function getOrderCourier(
  orderId: number,
  options: HttpOptions = {},
): Promise<ClientOrderCourier> {
  return clientOrderCourierSchema.parse(await http.get(ORDERS_API_PATHS.courier(orderId), options));
}
