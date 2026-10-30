import { type SQL, sql } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { ROLE } from '@/common/enums/role.enum';
import { sqlLiteral, sqlLiteralList } from '@/database/sql-literal';
import { orders, orderStatusHistory, roles, users } from '@/database/schema';
import { ORDER_CANCELLED_BY } from '@/modules/orders/constants/orders.constants';
import { MANAGER_STATUS_GROUP_STATUSES } from '../constants/manager-orders.constants';

const STATUS = {
  CONFIRMED: sqlLiteral(ORDER_STATUS.CONFIRMED),
  ASSIGNED: sqlLiteral(ORDER_STATUS.COURIER_ASSIGNED),
  DELIVERED: sqlLiteral(ORDER_STATUS.DELIVERED),
  CANCELLED: sqlLiteral(ORDER_STATUS.CANCELLED),
};
const CANCELLED_STATUSES = sqlLiteralList(MANAGER_STATUS_GROUP_STATUSES.cancelled);
const STAFF_ROLES = sqlLiteralList([ROLE.MANAGER, ROLE.ADMIN]);
const SECONDS_PER_MINUTE = sql.raw('60');

export function placedInPeriod(start: Date, end: Date): SQL {
  return sql`${orders.createdAt} >= ${start} and ${orders.createdAt} < ${end} and exists (
    select 1 from ${orderStatusHistory}
    where ${orderStatusHistory.orderId} = ${orders.orderId} and ${orderStatusHistory.status} = ${STATUS.CONFIRMED}
  )`;
}

const timeline = sql`select
    min(${orderStatusHistory.changedAt}) filter (where ${orderStatusHistory.status} = ${STATUS.CONFIRMED}) as confirmed_at,
    min(${orderStatusHistory.changedAt}) filter (where ${orderStatusHistory.status} = ${STATUS.ASSIGNED}) as assigned_at,
    (array_agg(${orderStatusHistory.changedBy} order by ${orderStatusHistory.changedAt}, ${orderStatusHistory.statusHistoryId})
      filter (where ${orderStatusHistory.status} = ${STATUS.ASSIGNED}))[1] as assigned_by,
    (array_agg(${orderStatusHistory.changedBy} order by ${orderStatusHistory.changedAt} desc, ${orderStatusHistory.statusHistoryId} desc)
      filter (where ${orderStatusHistory.status} = ${STATUS.CANCELLED}))[1] as cancelled_by
  from ${orderStatusHistory}
  where ${orderStatusHistory.orderId} = ${orders.orderId}`;

const assignedByStaff = sql`exists (
    select 1 from ${users} inner join ${roles} on ${roles.roleId} = ${users.roleId}
    where ${users.userId} = timeline.assigned_by and ${roles.name} in (${STAFF_ROLES})
  )`;

const cancelledBy = sql`case when ${orders.status} = ${STATUS.CANCELLED} then
    case
      when timeline.cancelled_by is null then ${sqlLiteral(ORDER_CANCELLED_BY.SYSTEM)}
      when timeline.cancelled_by = ${orders.clientId} then ${sqlLiteral(ORDER_CANCELLED_BY.CLIENT)}
      else ${sqlLiteral(ORDER_CANCELLED_BY.STAFF)}
    end
  end`;

export function orderFactsSql(start: Date, end: Date): SQL {
  return sql`select ${orders.orderId} as order_id, ${orders.courierId} as courier_id,
    ${orders.status} as status, ${orders.createdAt} as created_at, ${orders.finishedAt} as finished_at,
    ${orders.estimatedMinutes} as estimated_minutes, ${orders.price} as price,
    timeline.confirmed_at, timeline.assigned_at,
    ${assignedByStaff} as assigned_by_staff, ${cancelledBy} as cancelled_by
  from ${orders}
  left join lateral (${timeline}) as timeline on true
  where ${placedInPeriod(start, end)}`;
}

const isDelivered = sql`f.status = ${STATUS.DELIVERED}`;
const isTimed = sql`${isDelivered} and f.confirmed_at is not null and f.estimated_minutes is not null`;

export const ORDER_FACT = {
  isDelivered,
  isTimed,
  isOnTime: sql`${isTimed} and f.finished_at <= f.confirmed_at + f.estimated_minutes * interval '1 minute'`,
  deliveryMinutes: sql`case when ${isDelivered}
    then extract(epoch from f.finished_at - f.confirmed_at) / ${SECONDS_PER_MINUTE} end`,
  isCancelled: sql`f.status in (${CANCELLED_STATUSES})`,
  cancelledBy: (who: string) => sql`f.cancelled_by = ${sqlLiteral(who)}`,
  searchMinutes: sql`extract(epoch from f.assigned_at - f.confirmed_at) / ${SECONDS_PER_MINUTE}`,
  isManual: sql`f.assigned_by_staff`,
} as const;

export function countIf(condition: SQL): SQL<number> {
  return sql<number>`(count(*) filter (where ${condition}))::int`;
}

export function averageOf(value: SQL): SQL<number | null> {
  return sql<number | null>`avg(${value})::float8`;
}

export function roundedSql(value: SQL, decimals: number): SQL<number | null> {
  return sql<number | null>`round((${value})::numeric, ${sql.raw(String(decimals))})::float8`;
}
