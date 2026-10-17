import {
  COURIER_ORDERS_API_PATHS,
  type CourierHistoryOrder,
  courierHistoryOrderSchema,
  http,
} from '@/shared/api';

// A finished order of the courier; 404 when it is not theirs, does not exist or is still active.
export async function getHistoryOrder(
  orderId: number,
  signal?: AbortSignal,
): Promise<CourierHistoryOrder> {
  return courierHistoryOrderSchema.parse(
    await http.get(COURIER_ORDERS_API_PATHS.historyOrder(orderId), { signal }),
  );
}
