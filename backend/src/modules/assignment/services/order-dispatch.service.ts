import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, count, eq, max } from 'drizzle-orm';
import { transitionOrderStatus } from '@/common/database/order-status-transition';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orderOffers, orderStatusHistory } from '@/database/schema';
import { OrderTransactionsService } from '@/modules/tracking/services/order-transactions.service';
import {
  CANDIDATE_SEARCH_TIMEOUT_MS,
  MAX_OFFERS_PER_ORDER,
} from '../constants/assignment.constants';
import type { CourierCandidate, DispatchOrder } from '../types/assignment.types';
import { CourierCandidatesService } from './courier-candidates.service';
import { DispatchOrdersService } from './dispatch-orders.service';
import { OfferNotifierService } from './offer-notifier.service';
import { OfferRoutesService } from './offer-routes.service';
import { OrderOffersService } from './order-offers.service';

@Injectable()
export class OrderDispatchService {
  private readonly logger = new Logger(OrderDispatchService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly dispatchOrders: DispatchOrdersService,
    private readonly candidates: CourierCandidatesService,
    private readonly routes: OfferRoutesService,
    private readonly offers: OrderOffersService,
    private readonly notifier: OfferNotifierService,
    private readonly orderTransactions: OrderTransactionsService,
  ) {}

  // One step of the search for a courier: an offer to the best candidate, or the manual queue
  // when the order has had enough offers or has waited too long with nobody near.
  async dispatch(orderId: number, now: Date = new Date()): Promise<void> {
    const order = await this.dispatchOrders.load(orderId);

    if (!order) {
      this.logger.warn(`Order ${orderId} to dispatch is missing`);
    } else if ((await this.countOffers(orderId)) >= MAX_OFFERS_PER_ORDER) {
      await this.moveToManual(orderId, `${MAX_OFFERS_PER_ORDER} offers were not accepted`);
    } else {
      await this.offerOrWait(order, now);
    }
  }

  private async offerOrWait(order: DispatchOrder, now: Date): Promise<void> {
    const candidates = await this.candidates.findNearest(order, now);

    if (candidates.length > 0) {
      await this.offerToFastest(order, candidates, now);
    } else if (await this.searchedTooLong(order.orderId, now)) {
      await this.moveToManual(order.orderId, 'no courier nearby');
    }
  }

  // Nothing happens when no route is built or the offer is not opened: the next round tries again.
  private async offerToFastest(
    order: DispatchOrder,
    candidates: CourierCandidate[],
    now: Date,
  ): Promise<void> {
    const plan = await this.routes.plan(order, candidates);
    const offerId = plan ? await this.offers.create(order.orderId, plan, now) : null;

    if (plan && offerId !== null) {
      await this.notifier.announce(offerId, plan.courierProfileId);
      this.logger.log(`Order ${order.orderId} offered to courier ${plan.courierProfileId}`);
    }
  }

  private async countOffers(orderId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(orderOffers)
      .where(eq(orderOffers.orderId, orderId));

    return row?.total ?? 0;
  }

  // The search time runs from the payment, the moment the order became confirmed.
  private async searchedTooLong(orderId: number, now: Date): Promise<boolean> {
    const [row] = await this.db
      .select({ confirmedAt: max(orderStatusHistory.changedAt) })
      .from(orderStatusHistory)
      .where(
        and(
          eq(orderStatusHistory.orderId, orderId),
          eq(orderStatusHistory.status, ORDER_STATUS.CONFIRMED),
        ),
      );
    const confirmedAt = row?.confirmedAt ?? null;

    return (
      confirmedAt !== null && now.getTime() - confirmedAt.getTime() >= CANDIDATE_SEARCH_TIMEOUT_MS
    );
  }

  private async moveToManual(orderId: number, reason: string): Promise<void> {
    const moved = await this.orderTransactions.run((orderTx) =>
      transitionOrderStatus(orderTx, {
        orderId,
        from: ORDER_STATUS.CONFIRMED,
        to: ORDER_STATUS.AWAITING_MANUAL_ASSIGNMENT,
        changedBy: null,
      }),
    );

    if (moved) {
      this.logger.warn(`Order ${orderId} needs manual assignment: ${reason}`);
    }
  }
}
