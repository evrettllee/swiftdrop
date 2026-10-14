import { and, eq, gt, type SQL } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '../../../common/enums/order-offer-status.enum';
import { orderOffers } from '../../../database/schema';

// An offer of the courier that can still be answered: pending and with time left.
export function openOfferOf(courierProfileId: number, now: Date): SQL | undefined {
  return and(
    eq(orderOffers.courierId, courierProfileId),
    eq(orderOffers.status, ORDER_OFFER_STATUS.PENDING),
    gt(orderOffers.expiresAt, now),
  );
}
