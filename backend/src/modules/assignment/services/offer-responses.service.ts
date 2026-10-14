import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, gt } from 'drizzle-orm';
import {
  ORDERS_ONE_ACTIVE_PER_COURIER_INDEX,
  SINGLE_ROW_LIMIT,
} from '../../../common/constants/database.constants';
import { transitionOrderStatus } from '../../../common/database/order-status-transition';
import { getUniqueViolationConstraint, isLockTimeout } from '../../../common/database/pg-errors';
import { ORDER_OFFER_STATUS } from '../../../common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database, Transaction } from '../../../database/database.module';
import { orderOffers } from '../../../database/schema';
import { ASSIGNMENT_ERROR_MESSAGES } from '../constants/assignment.constants';
import { OfferNotifierService } from './offer-notifier.service';

@Injectable()
export class OfferResponsesService {
  private readonly logger = new Logger(OfferResponsesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly notifier: OfferNotifierService,
  ) {}

  // The courier takes the order of the offer; the order is theirs once this returns.
  async accept(
    userId: number,
    courierProfileId: number,
    offerId: number,
    now: Date = new Date(),
  ): Promise<{ orderId: number }> {
    let accepted: { orderId: number };

    try {
      accepted = await this.db.transaction((tx) =>
        this.takeOrder(tx, userId, courierProfileId, offerId, now),
      );
    } catch (error) {
      if (isLockTimeout(error)) {
        throw new ConflictException(ASSIGNMENT_ERROR_MESSAGES.BUSY);
      }

      if (getUniqueViolationConstraint(error) === ORDERS_ONE_ACTIVE_PER_COURIER_INDEX) {
        throw new ConflictException(ASSIGNMENT_ERROR_MESSAGES.ON_ORDER);
      }

      throw error;
    }

    this.notifier.withdraw(offerId, courierProfileId);
    this.logger.log(`Courier ${courierProfileId} accepted order ${accepted.orderId}`);

    return accepted;
  }

  async decline(courierProfileId: number, offerId: number, now: Date = new Date()): Promise<void> {
    const [declined] = await this.db
      .update(orderOffers)
      .set({ status: ORDER_OFFER_STATUS.DECLINED, respondedAt: now })
      .where(this.openOffer(courierProfileId, offerId, now))
      .returning({ orderId: orderOffers.orderId });

    if (!declined) {
      await this.rejectClosed(this.db, courierProfileId, offerId);
    }

    this.notifier.withdraw(offerId, courierProfileId);
    this.logger.log(`Courier ${courierProfileId} declined offer ${offerId}`);
  }

  // Both changes commit together: an offer is never accepted for an order the courier did not get.
  private async takeOrder(
    tx: Transaction,
    userId: number,
    courierProfileId: number,
    offerId: number,
    now: Date,
  ): Promise<{ orderId: number }> {
    const [offer] = await tx
      .update(orderOffers)
      .set({ status: ORDER_OFFER_STATUS.ACCEPTED, respondedAt: now })
      .where(this.openOffer(courierProfileId, offerId, now))
      .returning({ orderId: orderOffers.orderId });

    if (!offer) {
      return this.rejectClosed(tx, courierProfileId, offerId);
    }

    const assigned = await transitionOrderStatus(tx, {
      orderId: offer.orderId,
      from: ORDER_STATUS.CONFIRMED,
      to: ORDER_STATUS.COURIER_ASSIGNED,
      changedBy: userId,
      changes: { courierId: courierProfileId },
    });

    if (!assigned) {
      throw new ConflictException(ASSIGNMENT_ERROR_MESSAGES.ORDER_UNAVAILABLE);
    }

    return { orderId: offer.orderId };
  }

  // An offer of this courier that is still open; a second answer waits for the first one and then
  // finds the offer closed.
  private openOffer(courierProfileId: number, offerId: number, now: Date) {
    return and(
      eq(orderOffers.offerId, offerId),
      eq(orderOffers.courierId, courierProfileId),
      eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING),
      gt(orderOffers.expiresAt, now),
    );
  }

  // Someone else's offer looks the same as a missing one.
  private async rejectClosed(
    executor: Database | Transaction,
    courierProfileId: number,
    offerId: number,
  ): Promise<never> {
    const [offer] = await executor
      .select({ offerId: orderOffers.offerId })
      .from(orderOffers)
      .where(and(eq(orderOffers.offerId, offerId), eq(orderOffers.courierId, courierProfileId)))
      .limit(SINGLE_ROW_LIMIT);

    throw offer
      ? new ConflictException(ASSIGNMENT_ERROR_MESSAGES.OFFER_CLOSED)
      : new NotFoundException(ASSIGNMENT_ERROR_MESSAGES.OFFER_NOT_FOUND);
  }
}
