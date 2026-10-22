import type { OrderStatus } from '../../../common/enums/order-status.enum';

// The payload of order:status; estimatedDeliveryAt is an ISO time or null, as in GET /orders/:id.
export type OrderStatusEvent = {
  orderId: number;
  status: OrderStatus;
  estimatedDeliveryAt: string | null;
};
