import { ORDER_STATUS, type OrderStatus } from '@/shared/api';

export const STAFF_ASSIGNABLE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
];

export const STAFF_CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
  ORDER_STATUS.COURIER_ASSIGNED,
];

export const CANDIDATE_SORT = {
  PICKUP_DISTANCE: 'pickupDistance:asc',
  NAME: 'name:asc',
} as const;

export type CandidateSort = (typeof CANDIDATE_SORT)[keyof typeof CANDIDATE_SORT];

export const UNSUITABLE_REASON = {
  OFFLINE: 'offline',
  STALE_LOCATION: 'stale_location',
  BUSY: 'busy',
  VEHICLE_MISMATCH: 'vehicle_mismatch',
  NO_VEHICLE: 'no_vehicle',
} as const;

export type UnsuitableReason = (typeof UNSUITABLE_REASON)[keyof typeof UNSUITABLE_REASON];

export const ORDER_REFUND = {
  NONE: 'none',
  PENDING: 'pending',
  REFUNDED: 'refunded',
} as const;

export type OrderRefund = (typeof ORDER_REFUND)[keyof typeof ORDER_REFUND];

export const ACTION_CONFLICT = {
  ORDER_NOT_ASSIGNABLE: 'ORDER_NOT_ASSIGNABLE',
  ORDER_NOT_REASSIGNABLE: 'ORDER_NOT_REASSIGNABLE',
  ORDER_NOT_RESTARTABLE: 'ORDER_NOT_RESTARTABLE',
  ORDER_NOT_CANCELLABLE: 'ORDER_NOT_CANCELLABLE',
  COURIER_NOT_AVAILABLE: 'COURIER_NOT_AVAILABLE',
  COURIER_CHANGED: 'COURIER_CHANGED',
  SAME_COURIER: 'SAME_COURIER',
} as const;

export type ActionConflict = (typeof ACTION_CONFLICT)[keyof typeof ACTION_CONFLICT];

export const ACTION_REASON_MAX_LENGTH = 500;
