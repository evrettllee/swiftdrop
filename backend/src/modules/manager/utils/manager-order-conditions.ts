import { and, eq, exists, gte, ilike, inArray, lt, not, or, type SQL, sql } from 'drizzle-orm';
import { alias, union } from 'drizzle-orm/pg-core';
import { PAYMENT_STATUS, type PaymentStatus } from '@/common/enums/payment-status.enum';
import type { DateRange } from '@/common/utils/date-range';
import type { Database } from '@/database/database.module';
import { orders, packages, payments, users } from '@/database/schema';
import { fullNameSql } from '@/database/sql-expressions';
import {
  MANAGER_STATUS_GROUP_STATUSES,
  type ManagerStatusGroup,
  PAYMENT_STATE,
  type PaymentState,
} from '../constants/manager-orders.constants';
import type { ManagerOrderFilters, OrderSearch } from '../types/manager-orders.types';

const SEARCH_ORDERS_ALIAS = 'search_orders';

export function statusGroupsCondition(
  groups: readonly ManagerStatusGroup[] | null,
): SQL | undefined {
  if (groups === null) {
    return undefined;
  }

  const statuses = [...new Set(groups.flatMap((group) => MANAGER_STATUS_GROUP_STATUSES[group]))];

  return inArray(orders.status, statuses);
}

function hasPayment(db: Database, status: PaymentStatus): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(payments)
      .where(and(eq(payments.orderId, orders.orderId), eq(payments.status, status))),
  );
}

export function paymentStateSql(db: Database): SQL<PaymentState> {
  return sql<PaymentState>`CASE WHEN ${hasPayment(db, PAYMENT_STATUS.PAID)} THEN ${PAYMENT_STATE.PAID} WHEN ${hasPayment(db, PAYMENT_STATUS.REFUNDED)} THEN ${PAYMENT_STATE.REFUNDED} ELSE ${PAYMENT_STATE.UNPAID} END`;
}

function paymentStateCondition(db: Database, state: PaymentState): SQL | undefined {
  const paid = hasPayment(db, PAYMENT_STATUS.PAID);
  const refunded = hasPayment(db, PAYMENT_STATUS.REFUNDED);

  if (state === PAYMENT_STATE.PAID) {
    return paid;
  }

  return state === PAYMENT_STATE.REFUNDED
    ? and(not(paid), refunded)
    : and(not(paid), not(refunded));
}

export function paymentCondition(
  db: Database,
  states: readonly PaymentState[] | null,
): SQL | undefined {
  return states === null
    ? undefined
    : or(...states.map((state) => paymentStateCondition(db, state)));
}

function numberSearch(db: Database, orderId: number | null, phone: string | null): SQL {
  const found = alias(orders, SEARCH_ORDERS_ALIAS);
  const branches = [
    ...(orderId === null
      ? []
      : [db.select({ orderId: found.orderId }).from(found).where(eq(found.orderId, orderId))]),
    ...(phone === null
      ? []
      : [
          db
            .select({ orderId: found.orderId })
            .from(found)
            .where(
              inArray(
                found.clientId,
                db.select({ userId: users.userId }).from(users).where(eq(users.phone, phone)),
              ),
            ),
          db.select({ orderId: found.orderId }).from(found).where(eq(found.recipientPhone, phone)),
        ]),
  ];
  const [first, second, ...rest] = branches;

  if (first === undefined) {
    return sql`false`;
  }

  return inArray(orders.orderId, second === undefined ? first : union(first, second, ...rest));
}

function textSearch(db: Database, pattern: string): SQL {
  const found = alias(orders, SEARCH_ORDERS_ALIAS);
  const matchedClients = db
    .select({ userId: users.userId })
    .from(users)
    .where(
      or(ilike(fullNameSql(users.firstName, users.lastName), pattern), ilike(users.email, pattern)),
    );

  return inArray(
    orders.orderId,
    union(
      db
        .select({ orderId: found.orderId })
        .from(found)
        .where(inArray(found.clientId, matchedClients)),
      db.select({ orderId: found.orderId }).from(found).where(ilike(found.recipientName, pattern)),
    ),
  );
}

export function searchCondition(db: Database, search: OrderSearch | null): SQL | undefined {
  if (search === null) {
    return undefined;
  }

  return search.kind === 'number'
    ? numberSearch(db, search.orderId, search.phone)
    : textSearch(db, search.pattern);
}

function periodCondition({ start, end }: DateRange): SQL | undefined {
  return and(
    start === null ? undefined : gte(orders.createdAt, start),
    end === null ? undefined : lt(orders.createdAt, end),
  );
}

export function managerOrderConditions(
  db: Database,
  filters: ManagerOrderFilters,
): SQL | undefined {
  return and(
    periodCondition(filters.period),
    filters.courierId === null ? undefined : eq(orders.courierId, filters.courierId),
    paymentCondition(db, filters.payment),
    filters.fragile ? eq(packages.isFragile, true) : undefined,
    searchCondition(db, filters.search),
  );
}
