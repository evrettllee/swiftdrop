import { ORDER_STATUS, type OrderStatus } from '@/shared/api';

// The client may cancel until the courier picks the parcel up (matches CANCELLABLE_STATUSES of
// the backend).
export const CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
  ORDER_STATUS.COURIER_ASSIGNED,
];

// The courier carries the parcel: the order page offers to track it.
export const TRACKABLE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
];

// The order is with its courier, who moves: the map of the order follows them (matches
// COURIER_ACTIVE_ORDER_STATUSES of the backend).
export const COURIER_ACTIVE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.COURIER_ASSIGNED,
  ...TRACKABLE_STATUSES,
];

// Finished orders: the order page offers to repeat them (matches FINISHED_STATUSES of the backend).
export const FINISHED_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REJECTED,
];
