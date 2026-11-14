import { type SQL, sql } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { roles } from '@/database/schema';
import { sqlLiteral } from '@/database/sql-literal';

export const STATUS_SQL = {
  DELIVERED: sqlLiteral(ORDER_STATUS.DELIVERED),
  CANCELLED: sqlLiteral(ORDER_STATUS.CANCELLED),
} as const;

export function moneySql(value: SQL): SQL<number> {
  return sql<number>`round(coalesce(${value}, 0), 2)::float8`;
}

export function localDateSql(timestamp: SQL, timeZone: string): SQL<string> {
  return sql<string>`to_char(${timestamp} at time zone ${timeZone}, 'YYYY-MM-DD')`;
}

export const PERIODS = sql`(values (true), (false)) as periods(is_current)`;

export function isoSql(timestamp: SQL): SQL<string> {
  return sql<string>`to_char(${timestamp} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
}

export function minutesBetweenSql(from: SQL, to: SQL): SQL<number> {
  return sql<number>`extract(epoch from ${to} - ${from}) / 60`;
}

export function medianSql(value: SQL): SQL<number | null> {
  return sql<
    number | null
  >`round((percentile_cont(0.5) within group (order by ${value}))::numeric, 1)::float8`;
}

export function roleIdSql(role: string): SQL<number> {
  return sql<number>`(select ${roles.roleId} from ${roles} where ${roles.name} = ${sqlLiteral(role)})`;
}
