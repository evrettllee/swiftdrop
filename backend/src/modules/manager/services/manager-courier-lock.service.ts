import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, type SQL } from 'drizzle-orm';
import { ORDERS_ONE_ACTIVE_PER_COURIER_INDEX } from '@/common/constants/database.constants';
import { withLockConflict } from '@/common/database/lock-conflict';
import type { OrderTransaction } from '@/common/database/order-status-transition';
import { getUniqueViolationConstraint } from '@/common/database/pg-errors';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
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
import type { RevokedOffer } from '../types/manager-assignment.types';
import { type AssignableOrder, courierNotAvailable } from '../utils/assignable-order';
import { findCourierChecks } from '../utils/courier-candidates-query';

@Injectable()
export class ManagerCourierLockService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly orderTransactions: OrderTransactionsService,
    private readonly profiles: CourierProfilesService,
    private readonly notifier: OfferNotifierService,
  ) {}

  async run<T>(work: (orderTx: OrderTransaction) => Promise<T>): Promise<T> {
    try {
      return await withLockConflict(
        () => this.orderTransactions.run(work),
        MANAGER_ASSIGNMENT_MESSAGES.BUSY,
      );
    } catch (error) {
      if (getUniqueViolationConstraint(error) === ORDERS_ONE_ACTIVE_PER_COURIER_INDEX) {
        throw courierNotAvailable(UNSUITABLE_REASON.BUSY);
      }

      throw error;
    }
  }

  revokeOpenOffers(tx: Transaction, scope: SQL): Promise<RevokedOffer[]> {
    return tx
      .update(orderOffers)
      .set({ status: ORDER_OFFER_STATUS.REVOKED })
      .where(and(scope, eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING)))
      .returning({ offerId: orderOffers.offerId, courierId: orderOffers.courierId });
  }

  async lockAvailableCourier(
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

  withdraw(revoked: readonly RevokedOffer[]): void {
    for (const offer of revoked) {
      this.notifier.withdraw(offer.offerId, offer.courierId);
    }
  }
}
