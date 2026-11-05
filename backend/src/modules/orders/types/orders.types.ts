import type { OrderSupportTicket } from '@/common/database/order-support-ticket';
import type { ListPage } from '@/common/types/page.types';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { PaymentStatus } from '@/common/enums/payment-status.enum';
import type { ORDER_CANCELLED_BY } from '../constants/orders.constants';

export type CreatedOrder = {
  orderId: number;
  status: OrderStatus;
  price: number;
  currency: string;
  estimatedDeliveryAt: Date;
};

export type OrderAddressView = {
  city: string;
  street: string;
  house: string;
  apartment: string | null;
};

export type OrderListItem = {
  orderId: number;
  status: OrderStatus;
  price: number;
  currency: string;
  createdAt: Date;
  estimatedDeliveryAt: Date | null;
  pickup: OrderAddressView;
  delivery: OrderAddressView;
};

export type OrdersPage = ListPage<OrderListItem>;

export type OrderPointView = OrderAddressView & {
  latitude: number;
  longitude: number;
};

export type OrderParcelView = {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  isFragile: boolean;
};

export type OrderHistoryEntry = {
  status: OrderStatus;
  changedAt: Date;
};

export type OrderHistoryRow = OrderHistoryEntry & {
  changedBy: number | null;
  comment: string | null;
};

export type OrderCancelledBy = (typeof ORDER_CANCELLED_BY)[keyof typeof ORDER_CANCELLED_BY];

export type OrderHistoryView = {
  history: OrderHistoryEntry[];
  cancelledBy: OrderCancelledBy | null;
  cancelReason: string | null;
};

export type OrderPaymentView = {
  status: PaymentStatus;
  amountUsd: number;
};

export type OrderDetails = {
  orderId: number;
  status: OrderStatus;
  price: number;
  currency: string;
  priceCoefficient: number;
  distanceKm: number;
  // The time of the trip given at the placement, in minutes; it does not follow the arrival
  // estimate. Null for orders placed before it was kept.
  estimatedMinutes: number | null;
  estimatedDeliveryAt: Date | null;
  createdAt: Date;
  recipient: { name: string; phone: string };
  parcel: OrderParcelView;
  pickup: OrderPointView;
  delivery: OrderPointView;
  history: OrderHistoryEntry[];
  cancelledBy: OrderCancelledBy | null;
  cancelReason: string | null;
  payment: OrderPaymentView | null;
  supportTicket: OrderSupportTicket | null;
};

export type CancelledOrder = {
  orderId: number;
  status: OrderStatus;
};
