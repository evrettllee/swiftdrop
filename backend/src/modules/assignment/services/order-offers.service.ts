import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ROW_LOCK_NO_KEY_UPDATE, SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { isLockTimeout } from '@/common/database/pg-errors';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { orderOffers, orders } from '@/database/schema';
import { CourierProfilesService } from '@/modules/couriers/services/courier-profiles.service';
import { OFFER_TTL_MS } from '../constants/assignment.constants';
import type { OfferPlan } from '../types/assignment.types';

@Injectable()
export class OrderOffersService {
  private readonly logger = new Logger(OrderOffersService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly profiles: CourierProfilesService,
  ) {}

  // Opens an offer for the planned courier and returns its id, or null when it no longer fits:
  // the order left confirmed, the courier went off shift, or another offer of the order or of
  // the courier opened in between.
  async create(orderId: number, plan: OfferPlan, now: Date = new Date()): Promise<number | null> {
    let offerId: number | null = null;

    try {
      offerId = await this.db.transaction((tx) => this.insertOffer(tx, orderId, plan, now));
    } catch (error) {
      if (!isLockTimeout(error)) {
        throw error;
      }

      this.logger.warn(
        `Order ${orderId} or courier ${plan.courierProfileId} is busy, no offer now`,
      );
    }

    return offerId;
  }

  // The order and the courier stay locked until the commit, so a cancellation or going off shift
  // waits for the offer and then sees it.
  private async insertOffer(
    tx: Transaction,
    orderId: number,
    plan: OfferPlan,
    now: Date,
  ): Promise<number | null> {
    const [order] = await tx
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.orderId, orderId))
      .limit(SINGLE_ROW_LIMIT)
      .for(ROW_LOCK_NO_KEY_UPDATE);
    const isOnShift = await this.profiles.lockIsAvailable(tx, plan.courierProfileId);

    if (order?.status !== ORDER_STATUS.CONFIRMED || !isOnShift) {
      return null;
    }

    // The unique indexes keep one open offer per order and per courier: a conflict inserts nothing.
    const [offer] = await tx
      .insert(orderOffers)
      .values({
        orderId,
        courierId: plan.courierProfileId,
        offeredAt: now,
        expiresAt: new Date(now.getTime() + OFFER_TTL_MS),
        pickupEtaSec: plan.pickupEtaSec,
        totalEtaSec: plan.totalEtaSec,
      })
      .onConflictDoNothing()
      .returning({ offerId: orderOffers.offerId });

    return offer?.offerId ?? null;
  }
}
