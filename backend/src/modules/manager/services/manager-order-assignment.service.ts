import { Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { STAFF_ASSIGNABLE_STATUSES } from '@/common/constants/orders.constants';
import {
  type OrderTransaction,
  transitionOrderStatus,
} from '@/common/database/order-status-transition';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { orderOffers } from '@/database/schema';
import { OfferNotifierService } from '@/modules/assignment/services/offer-notifier.service';
import { UNSUITABLE_REASON } from '../constants/manager-assignment.constants';
import type { AssignedOrder, RevokedOffer } from '../types/manager-assignment.types';
import { courierNotAvailable, loadAssignableOrder } from '../utils/assignable-order';
import { ManagerCourierLockService } from './manager-courier-lock.service';

type AssignRequest = { managerUserId: number; orderId: number; courierId: number; now: Date };

@Injectable()
export class ManagerOrderAssignmentService {
  private readonly logger = new Logger(ManagerOrderAssignmentService.name);

  constructor(
    private readonly locks: ManagerCourierLockService,
    private readonly notifier: OfferNotifierService,
  ) {}

  async assign(
    managerUserId: number,
    orderId: number,
    courierId: number,
    now: Date = new Date(),
  ): Promise<AssignedOrder> {
    const request = { managerUserId, orderId, courierId, now };
    const revoked = await this.locks.run((orderTx) => this.assignInTransaction(orderTx, request));

    this.locks.withdraw(revoked);
    this.notifier.assigned(orderId, courierId);
    this.logger.log(`Manager ${managerUserId} assigned order ${orderId} to courier ${courierId}`);

    return { orderId, courierId };
  }

  private async assignInTransaction(
    orderTx: OrderTransaction,
    { managerUserId, orderId, courierId, now }: AssignRequest,
  ): Promise<RevokedOffer[]> {
    const { tx } = orderTx;
    const order = await loadAssignableOrder(tx, orderId, true);
    const revoked = [
      ...(await this.locks.revokeOpenOffers(tx, eq(orderOffers.orderId, orderId))),
      ...(await this.locks.revokeOpenOffers(tx, eq(orderOffers.courierId, courierId))),
    ];

    await this.locks.lockAvailableCourier(tx, order, courierId, now);

    const assigned = await transitionOrderStatus(orderTx, {
      orderId,
      from: STAFF_ASSIGNABLE_STATUSES,
      to: ORDER_STATUS.COURIER_ASSIGNED,
      changedBy: managerUserId,
      changes: { courierId },
    });

    if (!assigned) {
      throw courierNotAvailable(UNSUITABLE_REASON.BUSY);
    }

    return revoked;
  }
}
