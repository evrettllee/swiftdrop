import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, type SQL } from 'drizzle-orm';
import { ORDERS_ONE_ACTIVE_PER_COURIER_INDEX } from '@/common/constants/database.constants';
import { STAFF_ASSIGNABLE_STATUSES } from '@/common/constants/orders.constants';
import { withLockConflict } from '@/common/database/lock-conflict';
import {
  type OrderTransaction,
  transitionOrderStatus,
} from '@/common/database/order-status-transition';
import { getUniqueViolationConstraint } from '@/common/database/pg-errors';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { orderOffers } from '@/database/schema';
import { OfferNotifierService } from '@/modules/assignment/services/offer-notifier.service';
import { CourierProfilesService } from '@/modules/couriers/services/courier-profiles.service';
import { OrderTransactionsService } from '@/modules/tracking/services/order-transactions.service';
import {
  MANAGER_ASSIGNMENT_MESSAGES,
  UNSUITABLE_REASON,
} from '../constants/manager-assignment.constants';
import { unsuitableReasons } from '../mappers/courier-candidate.mapper';
import type { AssignedOrder } from '../types/manager-assignment.types';
import {
  type AssignableOrder,
  courierNotAvailable,
  loadAssignableOrder,
} from '../utils/assignable-order';
import { findCourierChecks } from '../utils/courier-candidates-query';

type RevokedOffer = { offerId: number; courierId: number };

type Assignment = { revoked: RevokedOffer[] };

type AssignRequest = { managerUserId: number; orderId: number; courierId: number; now: Date };

@Injectable()
export class ManagerOrderAssignmentService {
  private readonly logger = new Logger(ManagerOrderAssignmentService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly orderTransactions: OrderTransactionsService,
    private readonly profiles: CourierProfilesService,
    private readonly notifier: OfferNotifierService,
  ) {}

  async assign(
    managerUserId: number,
    orderId: number,
    courierId: number,
    now: Date = new Date(),
  ): Promise<AssignedOrder> {
    const { revoked } = await this.runAssignment({ managerUserId, orderId, courierId, now });

    for (const offer of revoked) {
      this.notifier.withdraw(offer.offerId, offer.courierId);
    }

    this.notifier.assigned(orderId, courierId);
    this.logger.log(`Manager ${managerUserId} assigned order ${orderId} to courier ${courierId}`);

    return { orderId, courierId };
  }

  private async runAssignment(request: AssignRequest): Promise<Assignment> {
    try {
      return await withLockConflict(
        () => this.orderTransactions.run((orderTx) => this.assignInTransaction(orderTx, request)),
        MANAGER_ASSIGNMENT_MESSAGES.BUSY,
      );
    } catch (error) {
      if (getUniqueViolationConstraint(error) === ORDERS_ONE_ACTIVE_PER_COURIER_INDEX) {
        throw courierNotAvailable(UNSUITABLE_REASON.BUSY);
      }

      throw error;
    }
  }

  private async assignInTransaction(
    orderTx: OrderTransaction,
    { managerUserId, orderId, courierId, now }: AssignRequest,
  ): Promise<Assignment> {
    const { tx } = orderTx;
    const order = await loadAssignableOrder(tx, orderId, true);
    const revoked = [
      ...(await this.revokeOpenOffers(tx, eq(orderOffers.orderId, orderId))),
      ...(await this.revokeOpenOffers(tx, eq(orderOffers.courierId, courierId))),
    ];

    await this.lockAvailableCourier(tx, order, courierId, now);

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

    return { revoked };
  }

  private revokeOpenOffers(tx: Transaction, scope: SQL): Promise<RevokedOffer[]> {
    return tx
      .update(orderOffers)
      .set({ status: ORDER_OFFER_STATUS.REVOKED })
      .where(and(scope, eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING)))
      .returning({ offerId: orderOffers.offerId, courierId: orderOffers.courierId });
  }

  private async lockAvailableCourier(
    tx: Transaction,
    order: AssignableOrder,
    courierId: number,
    now: Date,
  ): Promise<void> {
    await this.profiles.lockIsAvailable(tx, courierId);

    const checks = await findCourierChecks(this.db, tx, order, courierId, now);

    if (!checks) {
      throw new NotFoundException(MANAGER_ASSIGNMENT_MESSAGES.COURIER_NOT_FOUND);
    }

    const [reason] = unsuitableReasons(checks);

    if (reason !== undefined) {
      throw courierNotAvailable(reason);
    }
  }
}
