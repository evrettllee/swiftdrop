import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, gte, type SQL, sql } from 'drizzle-orm';
import { APP_TIME_ZONE } from '../../../common/constants/time.constants';
import { ORDER_OFFER_STATUS } from '../../../common/enums/order-offer-status.enum';
import { ORDER_STATUS } from '../../../common/enums/order-status.enum';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { orderOffers, orders, orderStatusHistory } from '../../../database/schema';
import type { CourierTodayStats } from '../types/deliveries.types';

@Injectable()
export class CourierStatsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async today(courierProfileId: number, now: Date = new Date()): Promise<CourierTodayStats> {
    const dayStart = this.dayStart(now);
    const [deliveries] = await this.db
      .select({
        delivered: count(),
        distanceKm: sql<number>`coalesce(sum(${orders.distanceKm}), 0)`.mapWith(Number),
      })
      .from(orders)
      .innerJoin(
        orderStatusHistory,
        and(
          eq(orderStatusHistory.orderId, orders.orderId),
          eq(orderStatusHistory.status, ORDER_STATUS.DELIVERED),
        ),
      )
      .where(
        and(
          eq(orders.courierId, courierProfileId),
          eq(orders.status, ORDER_STATUS.DELIVERED),
          gte(orderStatusHistory.changedAt, dayStart),
        ),
      );
    const [offers] = await this.db
      .select({
        received: count(),
        accepted:
          sql<number>`count(*) filter (where ${orderOffers.status} = ${ORDER_OFFER_STATUS.ACCEPTED})`.mapWith(
            Number,
          ),
      })
      .from(orderOffers)
      .where(
        and(eq(orderOffers.courierId, courierProfileId), gte(orderOffers.offeredAt, dayStart)),
      );

    return {
      delivered: deliveries?.delivered ?? 0,
      distanceKm: deliveries?.distanceKm ?? 0,
      offersReceived: offers?.received ?? 0,
      offersAccepted: offers?.accepted ?? 0,
      rating: null,
    };
  }

  // Midnight in Minsk on the day of the moment, whatever the time zone of the server is.
  private dayStart(now: Date): SQL {
    return sql`date_trunc('day', ${now}::timestamptz AT TIME ZONE ${APP_TIME_ZONE}) AT TIME ZONE ${APP_TIME_ZONE}`;
  }
}
