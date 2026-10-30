import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { STAFF_REASSIGNABLE_STATUSES } from '@/common/constants/orders.constants';
import {
  changeOrderCourier,
  type OrderTransaction,
} from '@/common/database/order-status-transition';
import { orderOffers } from '@/database/schema';
import { OfferNotifierService } from '@/modules/assignment/services/offer-notifier.service';
import {
  MANAGER_ASSIGNMENT_MESSAGES,
  SAME_COURIER_CODE,
  UNSUITABLE_REASON,
} from '../constants/manager-assignment.constants';
import type { AssignedOrder, RevokedOffer } from '../types/manager-assignment.types';
import {
  conflict,
  courierNotAvailable,
  ensureExpectedCourier,
  loadStaffOrder,
  REASSIGN_RULE,
} from '../utils/assignable-order';
import { ManagerCourierLockService } from './manager-courier-lock.service';

export type ReassignRequest = {
  managerUserId: number;
  orderId: number;
  courierId: number;
  expectedCourierId: number | null;
  reason: string | null;
  now: Date;
};

type Reassignment = { revoked: RevokedOffer[]; previousCourierId: number | null };

@Injectable()
export class ManagerOrderReassignmentService {
  private readonly logger = new Logger(ManagerOrderReassignmentService.name);

  constructor(
    private readonly locks: ManagerCourierLockService,
    private readonly notifier: OfferNotifierService,
  ) {}

  async reassign(request: ReassignRequest): Promise<AssignedOrder> {
    const { managerUserId, orderId, courierId } = request;
    const { revoked, previousCourierId } = await this.locks.run((orderTx) =>
      this.reassignInTransaction(orderTx, request),
    );

    this.locks.withdraw(revoked);

    if (previousCourierId !== null) {
      this.notifier.unassigned(orderId, previousCourierId);
    }

    this.notifier.assigned(orderId, courierId);
    this.logger.log(
      `Manager ${managerUserId} moved order ${orderId} from courier ${previousCourierId} to ${courierId}`,
    );

    return { orderId, courierId };
  }

  private async reassignInTransaction(
    orderTx: OrderTransaction,
    { managerUserId, orderId, courierId, expectedCourierId, reason, now }: ReassignRequest,
  ): Promise<Reassignment> {
    const { tx } = orderTx;
    const order = await loadStaffOrder(tx, orderId, REASSIGN_RULE, true);

    ensureExpectedCourier(order, expectedCourierId);

    if (order.courierId === courierId) {
      throw conflict(SAME_COURIER_CODE, MANAGER_ASSIGNMENT_MESSAGES.SAME_COURIER);
    }

    const revoked = await this.locks.revokeOpenOffers(tx, eq(orderOffers.courierId, courierId));

    await this.locks.lockAvailableCourier(tx, order, courierId, now);

    const changed = await changeOrderCourier(orderTx, {
      orderId,
      from: STAFF_REASSIGNABLE_STATUSES,
      courierId,
      previousCourierId: order.courierId,
      changedBy: managerUserId,
      comment: reason,
    });

    if (!changed) {
      throw courierNotAvailable(UNSUITABLE_REASON.BUSY);
    }

    return { revoked, previousCourierId: order.courierId };
  }
}
