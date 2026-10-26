import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, orderStatusHistory, packages } from '@/database/schema';
import { aliasOrderAddresses } from '@/modules/orders/utils/order-address-columns';
import { HISTORY_FIRST_PAGE, HISTORY_STATUSES } from '../constants/deliveries.constants';
import type { CourierHistoryDto } from '../dto/courier-history.dto';
import type { CourierHistoryPage } from '../types/deliveries.types';

@Injectable()
export class CourierHistoryService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // Finished orders of the courier, the newest first.
  async list(courierProfileId: number, query: CourierHistoryDto): Promise<CourierHistoryPage> {
    const { page, limit } = query;
    const condition = and(
      eq(orders.courierId, courierProfileId),
      inArray(orders.status, [...HISTORY_STATUSES]),
    );
    const { pickup, delivery } = aliasOrderAddresses();

    const [rows, [counted]] = await Promise.all([
      this.db
        .select({
          orderId: orders.orderId,
          status: orders.status,
          finishedAt: orderStatusHistory.changedAt,
          pickup: { street: pickup.street, house: pickup.house },
          delivery: { street: delivery.street, house: delivery.house },
          distanceKm: orders.distanceKm,
          weightKg: packages.weight,
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
        .where(condition)
        .orderBy(desc(orders.orderId))
        .limit(limit)
        .offset((page - HISTORY_FIRST_PAGE) * limit),
      this.db.select({ total: count() }).from(orders).where(condition),
    ]);

    return {
      items: rows.map((row) => ({ ...row, finishedAt: row.finishedAt?.toISOString() ?? null })),
      page,
      limit,
      total: counted?.total ?? 0,
    };
  }
}
