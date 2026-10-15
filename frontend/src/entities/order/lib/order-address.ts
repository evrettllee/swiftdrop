import type { OrderListItem } from '@/shared/api';
import { ORDER_TEXTS } from '../config/texts';

// The address of a point of an order: the list and the page of an order share its shape.
type OrderAddress = OrderListItem['pickup'];

// For example "Свердлова, 13а": the address in lists.
export function formatShortAddress(address: OrderAddress): string {
  return [address.street, address.house].join(ORDER_TEXTS.ADDRESS_PARTS_SEPARATOR);
}

// For example "пр-т Притыцкого, 83, кв. 47, Минск": the address on the page of an order.
export function formatFullAddress(address: OrderAddress): string {
  const parts = [address.street, address.house];

  if (address.apartment !== null) {
    parts.push(ORDER_TEXTS.apartment(address.apartment));
  }

  parts.push(address.city);

  return parts.join(ORDER_TEXTS.ADDRESS_PARTS_SEPARATOR);
}

// For example "пр-т Притыцкого, Минск": a delivery point a courier sees before taking the order.
export function formatAreaAddress(address: Pick<OrderAddress, 'street' | 'city'>): string {
  return [address.street, address.city].join(ORDER_TEXTS.ADDRESS_PARTS_SEPARATOR);
}
