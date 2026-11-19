import { type SQL, sql } from 'drizzle-orm';
import { ROLE } from '@/common/enums/role.enum';
import { courierProfiles, orders, users } from '@/database/schema';
import type {
  AnalyticsPeriod,
  AnalyticsRange,
} from '@/modules/manager/types/manager-analytics.types';
import { STATUS_SQL } from '@/common/database/analytics-sql';
import { localDateSql, PERIODS, roleIdSql } from './analytics-sql';

function clientOrdersSql(start: Date, end: Date, currentStart: Date): SQL {
  return sql`select ${orders.createdAt} >= ${currentStart} as is_current,
      ${orders.clientId} as client_id, count(*)::int as placed
    from ${orders}
    where ${orders.createdAt} >= ${start} and ${orders.createdAt} < ${end}
    group by 1, 2`;
}

export function usersKpiSql({ current, previous }: AnalyticsPeriod): SQL {
  return sql`with registered as (
      select ${users.createdAt} >= ${current.start} as is_current, count(*)::int as total
      from ${users}
      where ${users.roleId} = ${roleIdSql(ROLE.CLIENT)}
        and ${users.createdAt} >= ${previous.start} and ${users.createdAt} < ${current.end}
      group by 1
    ),
    active as (
      select is_current, count(*)::int as total, (count(*) filter (where placed >= 2))::int as repeat
      from (${clientOrdersSql(previous.start, current.end, current.start)}) as clients
      group by 1
    ),
    delivered as (
      select ${orders.finishedAt} >= ${current.start} as is_current, count(*)::int as total,
        count(distinct ${orders.courierId})::int as couriers
      from ${orders}
      where ${orders.status} = ${STATUS_SQL.DELIVERED}
        and ${orders.finishedAt} >= ${previous.start} and ${orders.finishedAt} < ${current.end}
      group by 1
    ),
    online as (
      select (count(*) filter (where ${courierProfiles.isAvailable}))::int as on_shift,
        count(*)::int as total
      from ${users}
      left join ${courierProfiles} on ${courierProfiles.userId} = ${users.userId}
      where ${users.roleId} = ${roleIdSql(ROLE.COURIER)} and not ${users.isBlocked}
        and ${users.deletedAt} is null and ${users.passwordHash} is not null
    )
    select periods.is_current as "isCurrent",
      coalesce(registered.total, 0) as "newClients",
      coalesce(active.total, 0) as "activeClients",
      coalesce(active.repeat, 0) as "repeatClients",
      round(delivered.total::numeric / nullif(delivered.couriers, 0), 1)::float8 as "averageDeliveriesPerCourier",
      online.on_shift as "onShift", online.total as "couriersTotal"
    from ${PERIODS}
    cross join online
    left join registered on registered.is_current = periods.is_current
    left join active on active.is_current = periods.is_current
    left join delivered on delivered.is_current = periods.is_current`;
}

export function newClientsByDaySql({ start, end }: AnalyticsRange, timeZone: string): SQL {
  return sql`select ${localDateSql(sql`${users.createdAt}`, timeZone)} as "date", count(*)::int as "count"
    from ${users}
    where ${users.roleId} = ${roleIdSql(ROLE.CLIENT)}
      and ${users.createdAt} >= ${start} and ${users.createdAt} < ${end}
    group by 1`;
}

export function ordersPerClientSql({ start, end }: AnalyticsRange): SQL {
  return sql`select (count(*) filter (where placed = 1))::int as "one",
      (count(*) filter (where placed = 2))::int as "two",
      (count(*) filter (where placed between 3 and 5))::int as "threeToFive",
      (count(*) filter (where placed >= 6))::int as "sixPlus"
    from (${clientOrdersSql(start, end, start)}) as clients`;
}
