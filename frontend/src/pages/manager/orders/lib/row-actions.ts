import type { OrderAction, StaffOrderTarget } from '@/features/manager-order-actions';
import {
  type ManagerOrderListItem,
  STAFF_ASSIGNABLE_STATUSES,
  STAFF_CANCELLABLE_STATUSES,
} from '@/shared/staff-api';

export type RowAction = (order: ManagerOrderListItem, action: OrderAction) => void;

export function canAssignRow(order: ManagerOrderListItem): boolean {
  return STAFF_ASSIGNABLE_STATUSES.includes(order.status);
}

export function canCancelRow(order: ManagerOrderListItem): boolean {
  return STAFF_CANCELLABLE_STATUSES.includes(order.status);
}

export function rowActionTarget(order: ManagerOrderListItem): StaffOrderTarget {
  return {
    orderId: order.id,
    status: order.status,
    courier: order.courier,
    price: order.price,
    paymentState: order.paymentState,
    parcelWeightKg: null,
  };
}
