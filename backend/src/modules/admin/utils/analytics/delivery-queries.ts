import { type SQL, sql } from 'drizzle-orm';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { sqlLiteral } from '@/database/sql-literal';
import { orderOffers, orders } from '@/database/schema';
import type {
  AnalyticsPeriod,
  AnalyticsRange,
} from '@/modules/manager/types/manager-analytics.types';
import { STATUS_SQL } from '@/common/database/analytics-sql';
import { localDateSql, PERIODS } from './analytics-sql';

const MINUTE_SECONDS = sql.raw('60');

export function deliveryKpiSql({ current, previous }: AnalyticsPeriod): SQL {
  return sql`with delivered as (
      select ${orders.finishedAt} >= ${current.start} as is_current,
        (count(*) filter (where ${orders.promisedDeliveryAt} is not null))::int as total,
        (count(*) filter (where ${orders.finishedAt} <= ${orders.promisedDeliveryAt}))::int as on_time,
        avg(extract(epoch from ${orders.finishedAt} - ${orders.paidAt}) / ${MINUTE_SECONDS}) as minutes
      from ${orders}
      where ${orders.status} = ${STATUS_SQL.DELIVERED}
        and ${orders.finishedAt} >= ${previous.start} and ${orders.finishedAt} < ${current.end}
      group by 1
    ),
    assigned as (
      select ${orders.firstAssignedAt} >= ${current.start} as is_current,
        (count(*) filter (where ${orders.firstAssignedAuto}))::int as auto,
        count(*)::int as total,
        avg(extract(epoch from ${orders.firstAssignedAt} - ${orders.paidAt})) as search_seconds
      from ${orders}
      where ${orders.firstAssignedAt} >= ${previous.start} and ${orders.firstAssignedAt} < ${current.end}
      group by 1
    )
    select periods.is_current as "isCurrent",
      coalesce(delivered.on_time, 0) as "onTime",
      coalesce(delivered.total, 0) as "onTimeTotal",
      round(delivered.minutes::numeric, 1)::float8 as "averageDeliveryMinutes",
      coalesce(assigned.auto, 0) as "auto",
      coalesce(assigned.total, 0) - coalesce(assigned.auto, 0) as "manual",
      round(assigned.search_seconds::numeric)::float8 as "averageSearchSeconds"
    from ${PERIODS}
    left join delivered on delivered.is_current = periods.is_current
    left join assigned on assigned.is_current = periods.is_current`;
}

export function onTimeByDaySql({ start, end }: AnalyticsRange, timeZone: string): SQL {
  return sql`select ${localDateSql(sql`${orders.finishedAt}`, timeZone)} as "date",
      (count(*) filter (where ${orders.finishedAt} <= ${orders.promisedDeliveryAt}))::int as "onTime",
      count(*)::int as "total"
    from ${orders}
    where ${orders.status} = ${STATUS_SQL.DELIVERED} and ${orders.promisedDeliveryAt} is not null
      and ${orders.finishedAt} >= ${start} and ${orders.finishedAt} < ${end}
    group by 1`;
}

const offerCount = (status: string) =>
  sql`(count(*) filter (where ${orderOffers.status} = ${sqlLiteral(status)}))::int`;

export function offersSql({ start, end }: AnalyticsRange): SQL {
  return sql`select ${offerCount(ORDER_OFFER_STATUS.ACCEPTED)} as "accepted",
      ${offerCount(ORDER_OFFER_STATUS.DECLINED)} as "declined",
      ${offerCount(ORDER_OFFER_STATUS.EXPIRED)} as "expired",
      count(*)::int as "total",
      count(distinct ${orderOffers.orderId})::int as "orders"
    from ${orderOffers}
    where ${orderOffers.offeredAt} >= ${start} and ${orderOffers.offeredAt} < ${end}`;
}
