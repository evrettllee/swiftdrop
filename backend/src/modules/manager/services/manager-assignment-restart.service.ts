import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { STAFF_AUTO_ASSIGN_RESTARTABLE_STATUSES } from '@/common/constants/orders.constants';
import {
  type OrderTransaction,
  transitionOrderStatus,
} from '@/common/database/order-status-transition';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { describeError } from '@/common/utils/describe-error';
import { orderOffers } from '@/database/schema';
import { OfferNotifierService } from '@/modules/assignment/services/offer-notifier.service';
import { OrderDispatchService } from '@/modules/assignment/services/order-dispatch.service';
import { OrderEventsService } from '@/modules/tracking/services/order-events.service';
import type { RestartedOrder, RevokedOffer } from '../types/manager-assignment.types';
import {
  conflict,
  ensureExpectedCourier,
  loadStaffOrder,
  RESTART_RULE,
} from '../utils/assignable-order';
import { ManagerCourierLockService } from './manager-courier-lock.service';

export type RestartRequest = {
  managerUserId: number;
  orderId: number;
  expectedCourierId: number | null;
  reason: string | null;
};

type Restart = { revoked: RevokedOffer[]; previousCourierId: number | null };

@Injectable()
export class ManagerAssignmentRestartService {
  private readonly logger = new Logger(ManagerAssignmentRestartService.name);

  constructor(
    private readonly locks: ManagerCourierLockService,
    private readonly notifier: OfferNotifierService,
    private readonly orderEvents: OrderEventsService,
    private readonly dispatcher: OrderDispatchService,
  ) {}

  async restart(request: RestartRequest): Promise<RestartedOrder> {
    const { managerUserId, orderId } = request;
    const { revoked, previousCourierId } = await this.locks.run((orderTx) =>
      this.restartInTransaction(orderTx, request),
    );

    this.locks.withdraw(revoked);

    if (previousCourierId !== null) {
      this.notifier.unassigned(orderId, previousCourierId);
      this.orderEvents.publishOrderCourier(orderId, null, previousCourierId);
    }

    this.logger.log(`Manager ${managerUserId} restarted the courier search of order ${orderId}`);
    await this.dispatchNow(orderId);

    return { orderId, status: ORDER_STATUS.CONFIRMED };
  }

  private async restartInTransaction(
    orderTx: OrderTransaction,
    { managerUserId, orderId, expectedCourierId, reason }: RestartRequest,
  ): Promise<Restart> {
    const { tx } = orderTx;
    const order = await loadStaffOrder(tx, orderId, RESTART_RULE, true);

    ensureExpectedCourier(order, expectedCourierId);

    const revoked = await this.locks.revokeOpenOffers(tx, eq(orderOffers.orderId, orderId));
    const restarted = await transitionOrderStatus(orderTx, {
      orderId,
      from: STAFF_AUTO_ASSIGN_RESTARTABLE_STATUSES,
      to: ORDER_STATUS.CONFIRMED,
      changedBy: managerUserId,
      comment: reason,
      changes: { courierId: null, assignmentRound: order.round + 1 },
    });

    if (!restarted) {
      throw conflict(RESTART_RULE.code, RESTART_RULE.message);
    }

    return { revoked, previousCourierId: order.courierId };
  }

  private async dispatchNow(orderId: number): Promise<void> {
    try {
      await this.dispatcher.dispatch(orderId);
    } catch (error) {
      this.logger.error(`Dispatch of restarted order ${orderId} failed: ${describeError(error)}`);
    }
  }
}
