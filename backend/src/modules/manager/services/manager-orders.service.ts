import { Inject, Injectable } from '@nestjs/common';
import { and, eq, max, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { type ListFetch, mapPageItems, paginate } from '@/common/database/paginate';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, packages, users } from '@/database/schema';
import { aliasOrderAddresses } from '@/modules/orders/utils/order-address-columns';
import type { ManagerOrdersDto } from '../dto/manager-orders.dto';
import { toManagerOrderListItem } from '../mappers/manager-order.mapper';
import type { ManagerOrdersPage } from '../types/manager-orders.types';
import {
  managerOrderConditions,
  paymentStateSql,
  statusGroupsCondition,
} from '../utils/manager-order-conditions';
import { countManagerOrders } from '../utils/manager-orders-count';
import { MANAGER_ORDERS_SORT } from '../utils/manager-orders-sort';

const CLIENT_ALIAS = 'client_user';
const COURIER_ALIAS = 'courier_user';
const PAGE_ALIAS = 'page';

@Injectable()
export class ManagerOrdersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(query: ManagerOrdersDto): Promise<ManagerOrdersPage> {
    const page = await paginate(query, {
      whitelist: MANAGER_ORDERS_SORT.whitelist,
      idColumn: orders.orderId,
      where: and(
        statusGroupsCondition(query.status),
        managerOrderConditions(this.db, query.filters),
      ),
      fetch: (options) => this.fetch(options),
      count: (where) => countManagerOrders(this.db, where),
      maxId: (where) => this.maxId(where),
      idOf: (row) => row.orderId,
    });

    return mapPageItems(page, ({ sortValue: _sortValue, ...row }) => toManagerOrderListItem(row));
  }

  private fetch({ where, orderBy, limit, offset, sortValue }: ListFetch) {
    const client = alias(users, CLIENT_ALIAS);
    const courierUser = alias(users, COURIER_ALIAS);
    const { pickup, delivery } = aliasOrderAddresses();
    const page = this.db
      .select({ pageOrderId: orders.orderId })
      .from(orders)
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)
      .as(PAGE_ALIAS);

    return this.db
      .select({
        orderId: orders.orderId,
        createdAt: orders.createdAt,
        status: orders.status,
        statusChangedAt: orders.statusChangedAt,
        price: orders.price,
        client: { firstName: client.firstName, lastName: client.lastName, phone: client.phone },
        pickup: { street: pickup.street, house: pickup.house },
        delivery: { street: delivery.street, house: delivery.house },
        courierId: orders.courierId,
        courier: { firstName: courierUser.firstName, lastName: courierUser.lastName },
        fragile: packages.isFragile,
        paymentState: paymentStateSql(),
        sortValue,
      })
      .from(page)
      .innerJoin(orders, eq(orders.orderId, page.pageOrderId))
      .innerJoin(packages, eq(packages.orderId, orders.orderId))
      .innerJoin(client, eq(client.userId, orders.clientId))
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
      .leftJoin(courierUser, eq(courierUser.userId, courierProfiles.userId))
      .orderBy(...orderBy);
  }

  private async maxId(where: SQL | undefined): Promise<number | null> {
    const [row] = await this.db
      .select({ maxId: max(orders.orderId) })
      .from(orders)
      .where(where);

    return row?.maxId ?? null;
  }
}
