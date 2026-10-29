import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, lt, max, type SQL } from 'drizzle-orm';
import { CURRENCY } from '@/common/constants/money.constants';
import { mapPageItems, paginate, type ListFetch } from '@/common/database/paginate';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { DateRange } from '@/common/utils/date-range';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import type { ListOrdersDto } from '../dto/list-orders.dto';
import {
  ACTIVE_STATUSES,
  FINISHED_STATUSES,
  ORDER_LIST_FILTER,
  ORDER_STATUS_GROUP_STATUSES,
} from '../constants/orders.constants';
import type { OrdersPage } from '../types/orders.types';
import { addressViewColumns, aliasOrderAddresses } from '../utils/order-address-columns';
import { ORDERS_SORT } from '../utils/orders-sort';

function statusesOf(query: ListOrdersDto): readonly OrderStatus[] | null {
  if (query.status !== null) {
    return [...new Set(query.status.flatMap((group) => ORDER_STATUS_GROUP_STATUSES[group]))];
  }

  if (query.filter === ORDER_LIST_FILTER.ACTIVE) {
    return ACTIVE_STATUSES;
  }

  return query.filter === ORDER_LIST_FILTER.FINISHED ? FINISHED_STATUSES : null;
}

function periodCondition({ start, end }: DateRange): SQL | undefined {
  return and(
    start === null ? undefined : gte(orders.createdAt, start),
    end === null ? undefined : lt(orders.createdAt, end),
  );
}

@Injectable()
export class OrdersQueryService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(clientId: number, query: ListOrdersDto): Promise<OrdersPage> {
    const statuses = statusesOf(query);
    const where = and(
      eq(orders.clientId, clientId),
      statuses === null ? undefined : inArray(orders.status, [...statuses]),
      periodCondition(query.period),
    );
    const page = await paginate(query, {
      whitelist: ORDERS_SORT.whitelist,
      idColumn: orders.orderId,
      where,
      fetch: (options) => this.fetch(options),
      count: (condition) => this.db.$count(orders, condition),
      maxId: (condition) => this.maxId(condition),
      idOf: (row) => row.orderId,
    });

    return mapPageItems(page, ({ sortValue: _sortValue, ...row }) => ({
      ...row,
      price: Number(row.price),
      currency: CURRENCY,
    }));
  }

  private fetch({ where, orderBy, limit, offset, sortValue }: ListFetch) {
    const { pickup, delivery } = aliasOrderAddresses();

    return this.db
      .select({
        orderId: orders.orderId,
        status: orders.status,
        price: orders.price,
        createdAt: orders.createdAt,
        estimatedDeliveryAt: orders.estimatedDeliveryAt,
        pickup: addressViewColumns(pickup),
        delivery: addressViewColumns(delivery),
        sortValue,
      })
      .from(orders)
      .innerJoin(pickup, eq(orders.pickupAddressId, pickup.addressId))
      .innerJoin(delivery, eq(orders.deliveryAddressId, delivery.addressId))
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);
  }

  private async maxId(where: SQL | undefined): Promise<number | null> {
    const [row] = await this.db
      .select({ maxId: max(orders.orderId) })
      .from(orders)
      .where(where);

    return row?.maxId ?? null;
  }
}
