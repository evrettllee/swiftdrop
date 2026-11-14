import { type SQL, sql } from 'drizzle-orm';
import { orders, serviceZones } from '@/database/schema';
import { NO_ZONE_NAME } from '@/modules/admin/constants/admin-analytics.constants';
import type { AnalyticsRange } from '@/modules/manager/types/manager-analytics.types';
import { moneySql, STATUS_SQL } from './analytics-sql';

const MINUTE_SECONDS = sql.raw('60');
const isDelivered = sql`${orders.status} = ${STATUS_SQL.DELIVERED}`;

export function deliveryZonesSql({ start, end }: AnalyticsRange): SQL {
  return sql`select ${orders.zoneId} as "zoneId",
      coalesce(${serviceZones.name}, ${NO_ZONE_NAME}) as "name",
      count(*)::int as "orders",
      (count(*) filter (where ${isDelivered} and ${orders.finishedAt} <= ${orders.promisedDeliveryAt}))::int
        as "onTime",
      (count(*) filter (where ${isDelivered} and ${orders.promisedDeliveryAt} is not null))::int
        as "onTimeTotal",
      round(avg(case when ${isDelivered}
        then extract(epoch from ${orders.finishedAt} - ${orders.paidAt}) / ${MINUTE_SECONDS} end)::numeric, 1)::float8
        as "averageDeliveryMinutes",
      (count(*) filter (where ${orders.firstAssignedAuto} = false))::int as "manualAssigned",
      ${moneySql(sql`sum(${orders.price}) filter (where ${isDelivered})`)} as "revenue"
    from ${orders}
    left join ${serviceZones} on ${serviceZones.zoneId} = ${orders.zoneId}
    where ${orders.createdAt} >= ${start} and ${orders.createdAt} < ${end}
    group by ${orders.zoneId}, ${serviceZones.name}
    order by ${orders.zoneId} is null, count(*) desc, ${serviceZones.name}`;
}
