import type { OrderStatus } from '../common/enums/order-status.enum';

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

export type OrdersPage = {
  items: OrderListItem[];
  total: number;
  page: number;
  limit: number;
};

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

export type OrderDetails = {
  orderId: number;
  status: OrderStatus;
  price: number;
  currency: string;
  priceCoefficient: number;
  distanceKm: number;
  estimatedDeliveryAt: Date | null;
  createdAt: Date;
  recipient: { name: string; phone: string };
  parcel: OrderParcelView;
  pickup: OrderPointView;
  delivery: OrderPointView;
  history: OrderHistoryEntry[];
};

export type CancelledOrder = {
  orderId: number;
  status: OrderStatus;
};
