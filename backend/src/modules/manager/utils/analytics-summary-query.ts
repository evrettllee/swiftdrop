import { type SQL, sql } from 'drizzle-orm';
import { PAYMENT_STATUS } from '@/common/enums/payment-status.enum';
import { sqlLiteral } from '@/database/sql-literal';
import { orders, payments } from '@/database/schema';
import { ORDER_CANCELLED_BY } from '@/modules/orders/constants/orders.constants';
import type { AnalyticsPeriod } from '../types/manager-analytics.types';
import { averageOf, countIf, ORDER_FACT, orderFactsSql, placedInPeriod } from './analytics-metrics';

const MONEY = sql.raw('numeric(14, 2)');

export function analyticsKpiSql({ current, previous }: AnalyticsPeriod): SQL {
  return sql`with f as (${orderFactsSql(previous.start, current.end)}),
  kpi as (
    select f.created_at >= ${current.start} as is_current,
      count(*)::int as total,
      ${countIf(ORDER_FACT.isDelivered)} as delivered,
      ${countIf(ORDER_FACT.isTimed)} as timed,
      ${countIf(ORDER_FACT.isOnTime)} as on_time,
      ${averageOf(ORDER_FACT.deliveryMinutes)} as avg_delivery_min,
      ${countIf(ORDER_FACT.isCancelled)} as cancelled,
      ${countIf(ORDER_FACT.cancelledBy(ORDER_CANCELLED_BY.CLIENT))} as by_client,
      ${countIf(ORDER_FACT.cancelledBy(ORDER_CANCELLED_BY.SYSTEM))} as by_system,
      ${countIf(ORDER_FACT.cancelledBy(ORDER_CANCELLED_BY.STAFF))} as by_staff,
      ${averageOf(ORDER_FACT.searchMinutes)} as avg_search_min,
      ${countIf(ORDER_FACT.isManual)} as manual
    from f
    group by 1
  ),
  paid as (
    select ${payments.paidAt} >= ${current.start} as is_current,
      sum(${orders.price}) as revenue,
      count(*)::int as paid_orders,
      round(avg(${orders.price}), 2)::text as avg_check
    from ${payments}
    inner join ${orders} on ${orders.orderId} = ${payments.orderId}
    where ${payments.status} = ${sqlLiteral(PAYMENT_STATUS.PAID)}
      and ${payments.paidAt} >= ${previous.start} and ${payments.paidAt} < ${current.end}
    group by 1
  )
  select periods.is_current as "isCurrent",
    coalesce(kpi.total, 0) as "total",
    coalesce(kpi.delivered, 0) as "delivered",
    coalesce(kpi.timed, 0) as "timed",
    coalesce(kpi.on_time, 0) as "onTime",
    kpi.avg_delivery_min as "avgDeliveryMin",
    coalesce(kpi.cancelled, 0) as "cancelled",
    coalesce(kpi.by_client, 0) as "cancelledByClient",
    coalesce(kpi.by_system, 0) as "cancelledBySystem",
    coalesce(kpi.by_staff, 0) as "cancelledByStaff",
    kpi.avg_search_min as "avgSearchMin",
    coalesce(kpi.manual, 0) as "manual",
    coalesce(paid.revenue, 0)::${MONEY}::text as "revenue",
    coalesce(paid.paid_orders, 0) as "paidOrders",
    paid.avg_check as "avgCheck"
  from (values (true), (false)) as periods(is_current)
  left join kpi on kpi.is_current = periods.is_current
  left join paid on paid.is_current = periods.is_current`;
}

export function analyticsActivitySql({ current }: AnalyticsPeriod, timeZone: string): SQL {
  const local = sql`(f.created_at at time zone ${timeZone})`;

  return sql`select to_char(${local}, 'YYYY-MM-DD') as "day",
      extract(hour from ${local})::int as "hour",
      ${countIf(ORDER_FACT.isDelivered)} as "delivered",
      ${countIf(ORDER_FACT.isCancelled)} as "cancelled",
      ${countIf(sql`not (${ORDER_FACT.isDelivered}) and not (${ORDER_FACT.isCancelled})`)} as "inProgress"
    from (
      select ${orders.status} as status, ${orders.createdAt} as created_at
      from ${orders}
      where ${placedInPeriod(current.start, current.end)}
    ) as f
    group by 1, 2`;
}
