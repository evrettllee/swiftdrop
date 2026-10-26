import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { CURRENCY } from '@/common/constants/money.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders } from '@/database/schema';
import type { ListOrdersDto } from '../dto/list-orders.dto';
import {
  ACTIVE_STATUSES,
  FINISHED_STATUSES,
  ORDER_LIST_FILTER,
  ORDERS_FIRST_PAGE,
} from '../constants/orders.constants';
import type { OrdersPage } from '../types/orders.types';
import { addressViewColumns, aliasOrderAddresses } from '../utils/order-address-columns';

@Injectable()
export class OrdersQueryService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(clientId: number, query: ListOrdersDto): Promise<OrdersPage> {
    const where = this.buildFilter(clientId, query.filter);
    const { pickup, delivery } = aliasOrderAddresses();

    const [rows, total] = await Promise.all([
      this.db
        .select({
          orderId: orders.orderId,
          status: orders.status,
          price: orders.price,
          createdAt: orders.createdAt,
          estimatedDeliveryAt: orders.estimatedDeliveryAt,
          pickup: addressViewColumns(pickup),
          delivery: addressViewColumns(delivery),
        })
        .from(orders)
        .innerJoin(pickup, eq(orders.pickupAddressId, pickup.addressId))
        .innerJoin(delivery, eq(orders.deliveryAddressId, delivery.addressId))
        .where(where)
        .orderBy(desc(orders.createdAt), desc(orders.orderId))
        .limit(query.limit)
        .offset((query.page - ORDERS_FIRST_PAGE) * query.limit),
      this.db.$count(orders, where),
    ]);

    return {
      items: rows.map((row) => ({ ...row, price: Number(row.price), currency: CURRENCY })),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private buildFilter(clientId: number, filter: ListOrdersDto['filter']): SQL | undefined {
    let statusFilter: SQL | undefined;

    if (filter === ORDER_LIST_FILTER.ACTIVE) {
      statusFilter = inArray(orders.status, [...ACTIVE_STATUSES]);
    } else if (filter === ORDER_LIST_FILTER.FINISHED) {
      statusFilter = inArray(orders.status, [...FINISHED_STATUSES]);
    }

    return and(eq(orders.clientId, clientId), statusFilter);
  }
}
