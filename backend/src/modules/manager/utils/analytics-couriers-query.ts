import { type SQL, sql } from 'drizzle-orm';
import { SORT_DIRECTION } from '@/common/constants/list.constants';
import { LIST_FIRST_PAGE } from '@/common/constants/list.constants';
import { ORDER_OFFER_STATUS } from '@/common/enums/order-offer-status.enum';
import { fullNameSql } from '@/database/sql-expressions';
import { sqlLiteral } from '@/database/sql-literal';
import { courierProfiles, courierShifts, orderOffers, users, vehicles } from '@/database/schema';
import {
  ANALYTICS_DECIMALS,
  ANALYTICS_OPEN_SHIFT_TAIL,
  type AnalyticsCourierSortKey,
} from '../constants/manager-analytics.constants';
import type { AnalyticsCouriersQuery, AnalyticsRange } from '../types/manager-analytics.types';
import { averageOf, countIf, ORDER_FACT, orderFactsSql, roundedSql } from './analytics-metrics';

const SECONDS_PER_HOUR = sql.raw('3600');

const SORT_COLUMNS: Record<AnalyticsCourierSortKey, SQL> = {
  delivered: sql.raw('delivered'),
  onTimePct: sql.raw('on_time_pct'),
  avgDeliveryMin: sql.raw('avg_delivery_min'),
  declinedOffers: sql.raw('declined_offers'),
  hoursOnline: sql.raw('hours_online'),
  name: sql.raw('name'),
};

export function shiftEndSql(): SQL {
  return sql`coalesce(${courierShifts.endedAt}, greatest(${courierShifts.startedAt}, least(now(),
    coalesce(${courierProfiles.locationUpdatedAt} + interval ${sqlLiteral(ANALYTICS_OPEN_SHIFT_TAIL)}, ${courierShifts.startedAt}))))`;
}

function shiftHoursSql({ start, end }: AnalyticsRange): SQL {
  const overlap = sql`least(${shiftEndSql()}, ${end}) - greatest(${courierShifts.startedAt}, ${start})`;

  return sql`select ${courierShifts.courierId} as courier_id,
      sum(extract(epoch from ${overlap})) / ${SECONDS_PER_HOUR} as hours
    from ${courierShifts}
    inner join ${courierProfiles} on ${courierProfiles.courierProfileId} = ${courierShifts.courierId}
    where ${courierShifts.startedAt} < ${end} and ${shiftEndSql()} > ${start}
    group by 1`;
}

function courierRowsSql(range: AnalyticsRange): SQL {
  const { start, end } = range;
  const declined = sqlLiteral(ORDER_OFFER_STATUS.DECLINED);

  return sql`with f as (${orderFactsSql(start, end)}),
  done as (
    select f.courier_id, count(*)::int as delivered,
      ${countIf(ORDER_FACT.isTimed)} as timed,
      ${countIf(ORDER_FACT.isOnTime)} as on_time,
      ${averageOf(ORDER_FACT.deliveryMinutes)} as avg_delivery
    from f
    where ${ORDER_FACT.isDelivered} and f.courier_id is not null
    group by 1
  ),
  offers as (
    select ${orderOffers.courierId} as courier_id,
      (count(*) filter (where ${orderOffers.status} = ${declined}))::int as declined
    from ${orderOffers}
    where ${orderOffers.offeredAt} >= ${start} and ${orderOffers.offeredAt} < ${end}
    group by 1
  ),
  shifts as (${shiftHoursSql(range)}),
  courier_rows as (
    select ${courierProfiles.courierProfileId} as courier_id,
      ${fullNameSql(users.firstName, users.lastName)} as name,
      ${vehicles.type} as vehicle_type,
      coalesce(done.delivered, 0) as delivered,
      ${roundedSql(sql`100.0 * done.on_time / nullif(done.timed, 0)`, ANALYTICS_DECIMALS.PERCENT)} as on_time_pct,
      ${roundedSql(sql`done.avg_delivery`, ANALYTICS_DECIMALS.MINUTES)} as avg_delivery_min,
      coalesce(offers.declined, 0) as declined_offers,
      ${roundedSql(sql`coalesce(shifts.hours, 0)`, ANALYTICS_DECIMALS.HOURS_ONLINE)} as hours_online
    from ${courierProfiles}
    inner join ${users} on ${users.userId} = ${courierProfiles.userId}
    left join ${vehicles} on ${vehicles.courierProfileId} = ${courierProfiles.courierProfileId}
    left join done on done.courier_id = ${courierProfiles.courierProfileId}
    left join offers on offers.courier_id = ${courierProfiles.courierProfileId}
    left join shifts on shifts.courier_id = ${courierProfiles.courierProfileId}
    where done.courier_id is not null or offers.courier_id is not null or shifts.courier_id is not null
  )`;
}

export function analyticsCouriersSql({ period, sort, page, limit }: AnalyticsCouriersQuery): SQL {
  const direction = sql.raw(sort.direction === SORT_DIRECTION.ASC ? 'asc' : 'desc');
  const offset = (page - LIST_FIRST_PAGE) * limit;

  return sql`${courierRowsSql(period.current)}
  select courier_id as "courierId", name, vehicle_type as "vehicleType", delivered,
    on_time_pct as "onTimePct", avg_delivery_min as "avgDeliveryMin",
    declined_offers as "declinedOffers", hours_online as "hoursOnline"
  from courier_rows
  order by ${SORT_COLUMNS[sort.key]} ${direction} nulls last, courier_id ${direction}
  limit ${limit} offset ${offset}`;
}

export function analyticsCouriersCountSql({ period }: AnalyticsCouriersQuery): SQL {
  return sql`${courierRowsSql(period.current)}
  select count(*)::int as "total" from courier_rows`;
}
