import { type SQL, sql } from 'drizzle-orm';
import { ORDER_FINISHED_STATUSES } from '@/common/constants/orders.constants';
import { sqlLiteralList } from '@/database/sql-literal';
import { cancelledByJoin } from '@/common/database/order-cancelled-by';
import { orders, payments } from '@/database/schema';
import type {
  AnalyticsPeriod,
  AnalyticsRange,
} from '@/modules/manager/types/manager-analytics.types';
import { localDateSql, moneySql, PERIODS, STATUS_SQL } from './analytics-sql';

const FINISHED = sqlLiteralList(ORDER_FINISHED_STATUSES);

export function businessKpiSql({ current, previous }: AnalyticsPeriod): SQL {
  return sql`with created as (
      select ${orders.createdAt} >= ${current.start} as is_current, count(*)::int as total
      from ${orders}
      where ${orders.createdAt} >= ${previous.start} and ${orders.createdAt} < ${current.end}
      group by 1
    ),
    delivered as (
      select ${orders.finishedAt} >= ${current.start} as is_current,
        sum(${orders.price}) as revenue, count(*)::int as total
      from ${orders}
      where ${orders.status} = ${STATUS_SQL.DELIVERED}
        and ${orders.finishedAt} >= ${previous.start} and ${orders.finishedAt} < ${current.end}
      group by 1
    ),
    refunded as (
      select ${payments.refundedAt} >= ${current.start} as is_current,
        sum(${payments.amount}) as amount, count(distinct ${payments.orderId})::int as total
      from ${payments}
      where ${payments.refundedAt} >= ${previous.start} and ${payments.refundedAt} < ${current.end}
      group by 1
    )
    select periods.is_current as "isCurrent",
      coalesce(created.total, 0) as "ordersCreated",
      ${moneySql(sql`delivered.revenue`)} as "revenue",
      coalesce(delivered.total, 0) as "delivered",
      round(delivered.revenue / nullif(delivered.total, 0), 2)::float8 as "averageCheck",
      ${moneySql(sql`refunded.amount`)} as "refundAmount",
      coalesce(refunded.total, 0) as "refundOrders"
    from ${PERIODS}
    left join created on created.is_current = periods.is_current
    left join delivered on delivered.is_current = periods.is_current
    left join refunded on refunded.is_current = periods.is_current`;
}

export function businessFunnelSql({ start, end }: AnalyticsRange): SQL {
  return sql`with facts as (
      select ${orders.status} as status, ${orders.clientId} as client_id,
        ${orders.paidAt} is not null as paid,
        ${orders.firstAssignedAt} is not null as assigned,
        cancelled.changed_by as cancelled_by
      from ${orders}
      ${cancelledByJoin(start, end)}
      where ${orders.createdAt} >= ${start} and ${orders.createdAt} < ${end}
    )
    select count(*)::int as "created",
      (count(*) filter (where paid))::int as "paid",
      (count(*) filter (where assigned))::int as "courierAssigned",
      (count(*) filter (where status = ${STATUS_SQL.DELIVERED}))::int as "delivered",
      (count(*) filter (where status = ${STATUS_SQL.CANCELLED} and not paid and cancelled_by is null))::int as "unpaidExpired",
      (count(*) filter (where status = ${STATUS_SQL.CANCELLED} and not paid and cancelled_by is not null))::int as "cancelledBeforePayment",
      (count(*) filter (where status = ${STATUS_SQL.CANCELLED} and paid and cancelled_by = client_id))::int as "cancelledByClient",
      (count(*) filter (where status = ${STATUS_SQL.CANCELLED} and paid and cancelled_by is null))::int as "cancelledBySystem",
      (count(*) filter (where status = ${STATUS_SQL.CANCELLED} and paid and cancelled_by <> client_id))::int as "cancelledByStaff",
      (count(*) filter (where status not in (${FINISHED})))::int as "inProgress"
    from facts`;
}

export function revenueByDaySql({ start, end }: AnalyticsRange, timeZone: string): SQL {
  return sql`select ${localDateSql(sql`${orders.finishedAt}`, timeZone)} as "date",
      ${moneySql(sql`sum(${orders.price})`)} as "revenue",
      count(*)::int as "delivered"
    from ${orders}
    where ${orders.status} = ${STATUS_SQL.DELIVERED}
      and ${orders.finishedAt} >= ${start} and ${orders.finishedAt} < ${end}
    group by 1`;
}
