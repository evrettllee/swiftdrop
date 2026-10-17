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

// The order waits for a courier: the page says so and the map pulses at the pickup point.
export const SEARCHING_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
];

// The backend tells who the courier is from the assignment on, also after the delivery.
export const COURIER_VISIBLE_STATUSES: readonly OrderStatus[] = [
  ...COURIER_ACTIVE_STATUSES,
  ORDER_STATUS.DELIVERED,
];

// The code for the courier is shown while the parcel is on its way and can be asked for.
export const CODE_VISIBLE_STATUSES: readonly OrderStatus[] = TRACKABLE_STATUSES;

// The page asks for the order again while it can still change under the eyes of the client. Not
// while it waits for the payment (the return from the payment has its own checks) and not once it
// is over.
export const POLLED_STATUSES: readonly OrderStatus[] = [
  ...SEARCHING_STATUSES,
  ...COURIER_ACTIVE_STATUSES,
];

// Finished orders: the order page offers to repeat them (matches FINISHED_STATUSES of the backend).
export const FINISHED_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REJECTED,
];
