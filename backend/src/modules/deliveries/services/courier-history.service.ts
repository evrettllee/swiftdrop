import { Inject, Injectable } from '@nestjs/common';
import { eq, max, type SQL } from 'drizzle-orm';
import { type ListFetch, mapPageItems, paginate } from '@/common/database/paginate';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, packages } from '@/database/schema';
import { aliasOrderAddresses } from '@/modules/orders/utils/order-address-columns';
import type { CourierHistoryDto } from '../dto/courier-history.dto';
import type { CourierHistoryPage, CourierHistorySummary } from '../types/deliveries.types';
import { historyCondition, historyTotalsQuery } from '../utils/history-query';
import { HISTORY_SORT } from '../utils/history-sort';

@Injectable()
export class CourierHistoryService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(courierProfileId: number, query: CourierHistoryDto): Promise<CourierHistoryPage> {
    const totals: { summary: CourierHistorySummary | null } = { summary: null };
    const page = await paginate(query, {
      whitelist: HISTORY_SORT.whitelist,
      idColumn: orders.orderId,
      where: historyCondition(courierProfileId, query.period, query.search),
      fetch: (options) => this.fetch(options),
      count: async (where) => {
        const [row] = await historyTotalsQuery(this.db, where);
        totals.summary = { count: row?.delivered ?? 0, distanceKm: row?.distanceKm ?? 0 };

        return row?.total ?? 0;
      },
      maxId: (where) => this.maxId(where),
      idOf: (row) => row.orderId,
    });
    const items = mapPageItems(page, ({ sortValue: _sortValue, ...row }) => ({
      ...row,
      finishedAt: row.finishedAt?.toISOString() ?? null,
    }));

    return totals.summary === null ? items : { ...items, summary: totals.summary };
  }

  private fetch({ where, orderBy, limit, offset, sortValue }: ListFetch) {
    const { pickup, delivery } = aliasOrderAddresses();

    return this.db
      .select({
        orderId: orders.orderId,
        status: orders.status,
        finishedAt: orders.finishedAt,
        pickup: { street: pickup.street, house: pickup.house },
        delivery: { street: delivery.street, house: delivery.house },
        distanceKm: orders.distanceKm,
        weightKg: packages.weight,
        sortValue,
      })
      .from(orders)
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .innerJoin(packages, eq(packages.orderId, orders.orderId))
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
