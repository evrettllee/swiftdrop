import { ORDER_STATUS, type OrderStatus } from '@/shared/api';

export const COURIER_ON_MAP_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.COURIER_ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
];
