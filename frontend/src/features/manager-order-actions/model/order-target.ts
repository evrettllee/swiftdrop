import { ORDER_STATUS, type OrderStatus } from '@/shared/api';
import { PAYMENT_STATE, type PaymentState } from '@/shared/staff-api';

export type StaffOrderTarget = {
  orderId: number;
  status: OrderStatus;
  courier: { id: number; name: string } | null;
  price: number;
  paymentState: PaymentState;
  parcelWeightKg: number | null;
};

export function expectedCourierId(target: StaffOrderTarget): number | null {
  return target.courier?.id ?? null;
}

export function hasAssignedCourier(target: StaffOrderTarget): boolean {
  return target.status === ORDER_STATUS.COURIER_ASSIGNED && target.courier !== null;
}

export function isRefundable(target: StaffOrderTarget): boolean {
  return target.paymentState === PAYMENT_STATE.PAID;
}
