import type { OrderListItem } from '@/shared/api';

type OrderAddress = OrderListItem['pickup'];

// For example "Свердлова, 13а": the address in lists.
export function formatShortAddress(address: OrderAddress): string {
  return `${address.street}, ${address.house}`;
}
