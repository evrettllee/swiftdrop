import { formatOrderNumber } from '@/entities/order';
import { assignCourier, type CourierCandidate, reassignCourier } from '@/shared/staff-api';
import { showToast } from '@/shared/ui/toast';
import { DONE_TEXTS } from '../config/texts';
import { toReason } from '../lib/reason';
import { expectedCourierId, type StaffOrderTarget } from './order-target';

export type AssignRequest = {
  target: StaffOrderTarget;
  isReassign: boolean;
  courier: CourierCandidate;
  reasonText: string;
};

export function sendAssignRequest({ target, isReassign, courier, reasonText }: AssignRequest) {
  return isReassign
    ? reassignCourier(target.orderId, {
        courierId: courier.courierId,
        expectedCourierId: expectedCourierId(target),
        reason: toReason(reasonText),
      })
    : assignCourier(target.orderId, courier.courierId);
}

export function showAssignedToast({ target, isReassign, courier }: AssignRequest): void {
  showToast({
    key: `order-action-${target.orderId}`,
    variant: 'success',
    title: isReassign ? DONE_TEXTS.REASSIGNED : DONE_TEXTS.ASSIGNED,
    text: DONE_TEXTS.orderCourier(formatOrderNumber(target.orderId), courier.name),
  });
}
