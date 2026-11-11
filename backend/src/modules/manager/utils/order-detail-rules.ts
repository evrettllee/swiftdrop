import {
  STAFF_ASSIGNABLE_STATUSES,
  STAFF_AUTO_ASSIGN_RESTARTABLE_STATUSES,
  STAFF_CANCELLABLE_STATUSES,
  STAFF_REASSIGNABLE_STATUSES,
} from '@/common/constants/orders.constants';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { ROLE, type RoleName } from '@/common/enums/role.enum';
import { ORDER_ACTOR, type OrderActor, PAYMENT_STATE } from '../constants/manager-orders.constants';
import type { ManagerOrderActions, ManagerOrderPayment } from '../dto/manager-order-details.dto';
import type { SettledPaymentRow } from './manager-order-related-queries';

function isIn(statuses: readonly OrderStatus[], status: OrderStatus): boolean {
  return statuses.includes(status);
}

export function toActions(status: OrderStatus): ManagerOrderActions {
  return {
    canAssign: isIn(STAFF_ASSIGNABLE_STATUSES, status),
    canReassign: isIn(STAFF_REASSIGNABLE_STATUSES, status),
    canRestartAutoAssign: isIn(STAFF_AUTO_ASSIGN_RESTARTABLE_STATUSES, status),
    canCancel: isIn(STAFF_CANCELLABLE_STATUSES, status),
  };
}

export function toActor(changedBy: number | null, role: RoleName | null): OrderActor {
  if (changedBy === null || role === null) {
    return ORDER_ACTOR.SYSTEM;
  }

  if (role === ROLE.CLIENT) {
    return ORDER_ACTOR.CLIENT;
  }

  return role === ROLE.COURIER ? ORDER_ACTOR.COURIER : ORDER_ACTOR.STAFF;
}

export function toPayment(rows: readonly SettledPaymentRow[]): ManagerOrderPayment {
  const paid = rows.find((row) => row.status === PAYMENT_STATUS.PAID);

  if (paid) {
    return { state: PAYMENT_STATE.PAID, paidAt: paid.paidAt, refundedAt: null };
  }

  const refunded = rows.findLast((row) => row.status === PAYMENT_STATUS.REFUNDED);

  return refunded
    ? { state: PAYMENT_STATE.REFUNDED, paidAt: refunded.paidAt, refundedAt: refunded.refundedAt }
    : { state: PAYMENT_STATE.UNPAID, paidAt: null, refundedAt: null };
}
