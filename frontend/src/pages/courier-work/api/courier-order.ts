import {
  COURIER_ORDERS_API_PATHS,
  type CourierOrder,
  courierOrderSchema,
  currentCourierOrderSchema,
  http,
} from '@/shared/api';

// The order the courier carries now; null when there is none, for example after a cancellation.
export async function getCurrentOrder(signal?: AbortSignal): Promise<CourierOrder | null> {
  const { order } = currentCourierOrderSchema.parse(
    await http.get(COURIER_ORDERS_API_PATHS.CURRENT, { signal }),
  );

  return order;
}

// The parcel is with the courier; the backend answers with the order after the step.
export async function pickUpOrder(orderId: number): Promise<CourierOrder> {
  return courierOrderSchema.parse(await http.post(COURIER_ORDERS_API_PATHS.pickup(orderId)));
}

// The courier sets off to the recipient.
export async function departOrder(orderId: number): Promise<CourierOrder> {
  return courierOrderSchema.parse(await http.post(COURIER_ORDERS_API_PATHS.depart(orderId)));
}

// The recipient's code closes the order; the backend counts the wrong tries and locks them.
export async function deliverOrder(orderId: number, code: string): Promise<CourierOrder> {
  return courierOrderSchema.parse(
    await http.post(COURIER_ORDERS_API_PATHS.deliver(orderId), { code }),
  );
}
