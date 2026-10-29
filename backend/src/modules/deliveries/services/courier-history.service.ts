import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray, max, type SQL } from 'drizzle-orm';
import { type ListFetch, mapPageItems, paginate } from '@/common/database/paginate';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, orderStatusHistory, packages } from '@/database/schema';
import { aliasOrderAddresses } from '@/modules/orders/utils/order-address-columns';
import { HISTORY_STATUSES } from '../constants/deliveries.constants';
import type { CourierHistoryDto } from '../dto/courier-history.dto';
import type { CourierHistoryPage } from '../types/deliveries.types';
import { HISTORY_SORT } from '../utils/history-sort';

@Injectable()
export class CourierHistoryService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // Finished orders of the courier, the newest first.
  async list(courierProfileId: number, query: CourierHistoryDto): Promise<CourierHistoryPage> {
    const page = await paginate(query, {
      whitelist: HISTORY_SORT.whitelist,
      idColumn: orders.orderId,
      where: and(
        eq(orders.courierId, courierProfileId),
        inArray(orders.status, [...HISTORY_STATUSES]),
      ),
      fetch: (options) => this.fetch(options),
      count: (where) => this.count(where),
      maxId: (where) => this.maxId(where),
      idOf: (row) => row.orderId,
    });

    return mapPageItems(page, ({ sortValue: _sortValue, ...row }) => ({
      ...row,
      finishedAt: row.finishedAt?.toISOString() ?? null,
    }));
  }

  private fetch({ where, orderBy, limit, offset, sortValue }: ListFetch) {
    const { pickup, delivery } = aliasOrderAddresses();

    return (
      this.db
        .select({
          orderId: orders.orderId,
          status: orders.status,
          finishedAt: orderStatusHistory.changedAt,
          pickup: { street: pickup.street, house: pickup.house },
          delivery: { street: delivery.street, house: delivery.house },
          distanceKm: orders.distanceKm,
          weightKg: packages.weight,
          sortValue,
        })
        .from(orders)
        .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
        .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
        // Every order has exactly one package (packages.order_id is unique).
        .innerJoin(packages, eq(packages.orderId, orders.orderId))
        // The final status is written to the history once, so this row is the moment it ended.
        .leftJoin(
          orderStatusHistory,
          and(
            eq(orderStatusHistory.orderId, orders.orderId),
            eq(orderStatusHistory.status, orders.status),
          ),
        )
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset)
    );
  }

  private async count(where: SQL | undefined): Promise<number> {
    const [row] = await this.db.select({ total: count() }).from(orders).where(where);

    return row?.total ?? 0;
  }

  private async maxId(where: SQL | undefined): Promise<number | null> {
    const [row] = await this.db
      .select({ maxId: max(orders.orderId) })
      .from(orders)
      .where(where);

    return row?.maxId ?? null;
  }
}
