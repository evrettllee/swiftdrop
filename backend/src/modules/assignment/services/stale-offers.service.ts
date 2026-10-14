import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lte, notExists, or } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '../../../common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { courierProfiles, orderOffers, orders } from '../../../database/schema';
import { OfferNotifierService } from './offer-notifier.service';

@Injectable()
export class StaleOffersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly notifier: OfferNotifierService,
  ) {}

  // Closes the open offers nobody can accept any more and returns how many were closed: the time
  // is up, the order is no longer waiting for a courier, or the courier went off shift.
  async close(now: Date = new Date()): Promise<number> {
    const closed = await this.db
      .update(orderOffers)
      .set({ status: ORDER_OFFER_STATUS.EXPIRED })
      .where(
        and(
          eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING),
          or(
            lte(orderOffers.expiresAt, now),
            notExists(this.waitingOrder()),
            notExists(this.courierOnShift()),
          ),
        ),
      )
      .returning({ offerId: orderOffers.offerId, courierId: orderOffers.courierId });

    for (const { offerId, courierId } of closed) {
      this.notifier.withdraw(offerId, courierId);
    }

    return closed.length;
  }

  // The subqueries below refer to the offer of the outer query.

  private waitingOrder() {
    return this.db
      .select({ orderId: orders.orderId })
      .from(orders)
      .where(
        and(eq(orders.orderId, orderOffers.orderId), eq(orders.status, ORDER_STATUS.CONFIRMED)),
      );
  }

  private courierOnShift() {
    return this.db
      .select({ courierProfileId: courierProfiles.courierProfileId })
      .from(courierProfiles)
      .where(
        and(
          eq(courierProfiles.courierProfileId, orderOffers.courierId),
          eq(courierProfiles.isAvailable, true),
        ),
      );
  }
}
