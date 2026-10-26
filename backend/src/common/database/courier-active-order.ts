import { type AnyColumn, and, eq, inArray, type SQL } from 'drizzle-orm';
import { orders } from '@/database/schema';
import { COURIER_ACTIVE_ORDER_STATUSES } from '@/common/constants/orders.constants';

// The order a courier carries now, at most one by the unique index of the orders table. The
// courier is an id or the column of an outer query.
export function courierActiveOrder(courierId: number | AnyColumn): SQL | undefined {
  return and(
    eq(orders.courierId, courierId),
    inArray(orders.status, [...COURIER_ACTIVE_ORDER_STATUSES]),
  );
}
