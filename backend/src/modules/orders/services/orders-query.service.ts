import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, lt, max, type SQL } from 'drizzle-orm';
import { mapPageItems, paginate, type ListFetch } from '@/common/database/paginate';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import type { DateRange } from '@/common/utils/date-range';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, users } from '@/database/schema';
import type { ListOrdersDto } from '../dto/list-orders.dto';
import { ORDER_STATUS_GROUP_STATUSES } from '../constants/orders.constants';
import { toOrderListItem } from '../mappers/order-list-item.mapper';
import type { OrdersPage } from '../types/orders.types';
import { addressViewColumns, aliasOrderAddresses } from '../utils/order-address-columns';
import { clientOrderSearchCondition } from '../utils/order-search';
import { ORDERS_SORT } from '../utils/orders-sort';

function statusesOf(query: ListOrdersDto): readonly OrderStatus[] | null {
  return query.status === null
    ? null
    : [...new Set(query.status.flatMap((group) => ORDER_STATUS_GROUP_STATUSES[group]))];
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
      clientOrderSearchCondition(this.db, query.search),
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

    return mapPageItems(page, ({ sortValue: _sortValue, ...row }) => toOrderListItem(row));
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
        courierFirstName: users.firstName,
        courierLastName: users.lastName,
        sortValue,
      })
      .from(orders)
      .innerJoin(pickup, eq(orders.pickupAddressId, pickup.addressId))
      .innerJoin(delivery, eq(orders.deliveryAddressId, delivery.addressId))
      .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
      .leftJoin(users, eq(users.userId, courierProfiles.userId))
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
