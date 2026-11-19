import { type SQL, sql } from 'drizzle-orm';
import { ORDER_STATUS } from '@/common/enums/order-status.enum';
import { sqlLiteral } from '@/database/sql-literal';

export const STATUS_SQL = {
  DELIVERED: sqlLiteral(ORDER_STATUS.DELIVERED),
  CANCELLED: sqlLiteral(ORDER_STATUS.CANCELLED),
} as const;

export function moneySql(value: SQL): SQL<number> {
  return sql<number>`round(coalesce(${value}, 0), 2)::float8`;
}
