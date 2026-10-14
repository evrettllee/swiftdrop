import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, notExists } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '../../../common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { describeError } from '../../../common/utils/describe-error';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { orderOffers, orders } from '../../../database/schema';
import { ASSIGNMENT_BATCH_SIZE } from '../constants/assignment.constants';
import { OrderDispatchService } from './order-dispatch.service';
import { StaleOffersService } from './stale-offers.service';

@Injectable()
export class AssignmentRoundService {
  private readonly logger = new Logger(AssignmentRoundService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly staleOffers: StaleOffersService,
    private readonly dispatcher: OrderDispatchService,
  ) {}

  // Closes the offers nobody can accept, then looks for a courier for every paid order that has
  // no open offer, the oldest order first.
  async run(now: Date = new Date()): Promise<void> {
    await this.staleOffers.close(now);

    const waiting = await this.db
      .select({ orderId: orders.orderId })
      .from(orders)
      .where(and(eq(orders.status, ORDER_STATUS.CONFIRMED), notExists(this.openOffer())))
      .orderBy(orders.orderId)
      .limit(ASSIGNMENT_BATCH_SIZE);

    for (const { orderId } of waiting) {
      await this.dispatchSafely(orderId, now);
    }
  }

  // Refers to the order of the outer query.
  private openOffer() {
    return this.db
      .select({ offerId: orderOffers.offerId })
      .from(orderOffers)
      .where(
        and(
          eq(orderOffers.orderId, orders.orderId),
          eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING),
        ),
      );
  }

  // One failing order must not stop the others, so its error only goes to the log.
  private async dispatchSafely(orderId: number, now: Date): Promise<void> {
    try {
      await this.dispatcher.dispatch(orderId, now);
    } catch (error) {
      this.logger.error(`Dispatch of order ${orderId} failed: ${describeError(error)}`);
    }
  }
}
