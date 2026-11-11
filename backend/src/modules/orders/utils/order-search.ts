import { and, eq, exists, ilike, or, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { escapeLike } from '@/common/utils/escape-like';
import type { Database } from '@/database/database.module';
import { addresses, orders } from '@/database/schema';
import {
  ORDER_ADDRESS_SEARCH_JOINER,
  ORDER_ADDRESS_SEARCH_SEPARATORS,
  ORDER_NUMBER_SEARCH,
  ORDER_SEARCH_ADDRESS_ALIAS,
} from '../constants/orders.constants';

export type ClientOrderSearch =
  { kind: 'number'; orderId: number | null } | { kind: 'text'; pattern: string };

function orderIdOf(digits: string): number | null {
  const value = Number(digits);

  return value > 0 && value <= DB_INTEGER_MAX ? value : null;
}

export function parseClientOrderSearch(query: string): ClientOrderSearch {
  if (ORDER_NUMBER_SEARCH.test(query)) {
    return { kind: 'number', orderId: orderIdOf(query) };
  }

  const words = query.replace(ORDER_ADDRESS_SEARCH_SEPARATORS, ORDER_ADDRESS_SEARCH_JOINER).trim();

  return { kind: 'text', pattern: `%${escapeLike(words)}%` };
}

function addressSearch(db: Database, pattern: string): SQL {
  const found = alias(addresses, ORDER_SEARCH_ADDRESS_ALIAS);

  return exists(
    db
      .select({ addressId: found.addressId })
      .from(found)
      .where(
        and(
          or(
            eq(found.addressId, orders.pickupAddressId),
            eq(found.addressId, orders.deliveryAddressId),
          ),
          ilike(sql`${found.street} || ${ORDER_ADDRESS_SEARCH_JOINER} || ${found.house}`, pattern),
        ),
      ),
  );
}

export function clientOrderSearchCondition(
  db: Database,
  search: ClientOrderSearch | null,
): SQL | undefined {
  if (search === null) {
    return undefined;
  }

  if (search.kind === 'text') {
    return addressSearch(db, search.pattern);
  }

  return search.orderId === null ? sql`false` : eq(orders.orderId, search.orderId);
}
