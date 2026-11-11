import { and, count, eq, gte, inArray, lt, sql, type SQL } from 'drizzle-orm';
import { ORDER_STATUS, type OrderStatus } from '@/common/enums/order-status.enum';
import type { DateRange } from '@/common/utils/date-range';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import { HISTORY_DISTANCE_DECIMALS, HISTORY_STATUSES } from '../constants/deliveries.constants';
import type { HistorySearch } from '../dto/courier-history.dto';

function periodCondition({ start, end }: DateRange): SQL | undefined {
  return and(
    start === null ? undefined : gte(orders.finishedAt, start),
    end === null ? undefined : lt(orders.finishedAt, end),
  );
}

function searchCondition(search: HistorySearch | null): SQL | undefined {
  if (search === null) {
    return undefined;
  }

  return search.orderId === null ? sql`false` : eq(orders.orderId, search.orderId);
}

export function historyCondition(
  courierProfileId: number,
  period: DateRange,
  search: HistorySearch | null,
  status: OrderStatus | null = null,
): SQL | undefined {
  return and(
    eq(orders.courierId, courierProfileId),
    status === null ? inArray(orders.status, [...HISTORY_STATUSES]) : eq(orders.status, status),
    periodCondition(period),
    searchCondition(search),
  );
}

const isDelivered = sql`${orders.status} = ${ORDER_STATUS.DELIVERED}`;

export function historyTotalsQuery(db: Database, where: SQL | undefined) {
  return db
    .select({
      total: count(),
      delivered: sql<number>`count(*) filter (where ${isDelivered})`.mapWith(Number),
      distanceKm:
        sql<number>`round(coalesce(sum(${orders.distanceKm}) filter (where ${isDelivered}), 0), ${HISTORY_DISTANCE_DECIMALS})`.mapWith(
          Number,
        ),
    })
    .from(orders)
    .where(where);
}
