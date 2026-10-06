export const ORDER_STATUS_VALUES = [
  'pending',
  'confirmed',
  'awaiting_manual_assignment',
  'courier_assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
  'rejected',
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  AWAITING_MANUAL_ASSIGNMENT: 'awaiting_manual_assignment',
  COURIER_ASSIGNED: 'courier_assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const satisfies Record<string, OrderStatus>;
