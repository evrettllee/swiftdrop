import { and, eq, exists, inArray, or, type SQL, sql } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import type { Database, Transaction } from '@/database/database.module';
import { courierProfiles, orderOffers, orders, orderStatusHistory } from '@/database/schema';

export function courierWasOnOrder(executor: Database | Transaction, courierUserId: number): SQL {
  const profileIds = executor
    .select({ courierProfileId: courierProfiles.courierProfileId })
    .from(courierProfiles)
    .where(eq(courierProfiles.userId, courierUserId));
  const acceptedOffer = executor
    .select({ offerId: orderOffers.offerId })
    .from(orderOffers)
    .innerJoin(courierProfiles, eq(courierProfiles.courierProfileId, orderOffers.courierId))
    .where(
      and(
        eq(orderOffers.orderId, orders.orderId),
        eq(orderOffers.status, ORDER_OFFER_STATUS.ACCEPTED),
        eq(courierProfiles.userId, courierUserId),
      ),
    );
  const ownHistoryRow = executor
    .select({ statusHistoryId: orderStatusHistory.statusHistoryId })
    .from(orderStatusHistory)
    .where(
      and(
        eq(orderStatusHistory.orderId, orders.orderId),
        eq(orderStatusHistory.changedBy, courierUserId),
      ),
    );

  return (
    or(inArray(orders.courierId, profileIds), exists(acceptedOffer), exists(ownHistoryRow)) ??
    sql`false`
  );
}
