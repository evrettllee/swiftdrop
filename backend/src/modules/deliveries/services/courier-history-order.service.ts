import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { parcelColumns } from '@/common/database/parcel-columns';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { orders, orderStatusHistory, packages } from '@/database/schema';
import {
  addressPointColumns,
  aliasOrderAddresses,
} from '@/modules/orders/utils/order-address-columns';
import {
  COURIER_STAGE_STATUSES,
  DELIVERIES_ERROR_MESSAGES,
  HISTORY_STATUSES,
} from '../constants/deliveries.constants';
import type { CourierHistoryOrder } from '../types/deliveries.types';

type HistoryOrderRow = Omit<CourierHistoryOrder, 'finishedAt' | 'history'> & {
  finishedAt: Date | null;
};

// A finished order of the courier with the stages they went through. Only the courier's own
// finished order is found: a foreign, a missing and an active one answer the same 404, so ids
// cannot be probed and the current order keeps to its own screen.
@Injectable()
export class CourierHistoryOrderService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findOne(courierProfileId: number, orderId: number): Promise<CourierHistoryOrder> {
    const { finishedAt, ...row } = await this.findRow(courierProfileId, orderId);
    // Read only after the order proved to be the courier's.
    const history = await this.db
      .select({ status: orderStatusHistory.status, changedAt: orderStatusHistory.changedAt })
      .from(orderStatusHistory)
      .where(
        and(
          eq(orderStatusHistory.orderId, orderId),
          inArray(orderStatusHistory.status, [...COURIER_STAGE_STATUSES]),
        ),
      )
      .orderBy(asc(orderStatusHistory.changedAt), asc(orderStatusHistory.statusHistoryId));

    return { ...row, finishedAt: finishedAt?.toISOString() ?? null, history };
  }

  async findRow(courierProfileId: number, orderId: number): Promise<HistoryOrderRow> {
    const { pickup, delivery } = aliasOrderAddresses();

    const [row] = await this.db
      .select({
        orderId: orders.orderId,
        status: orders.status,
        finishedAt: orderStatusHistory.changedAt,
        pickup: addressPointColumns(pickup),
        delivery: addressPointColumns(delivery),
        parcel: parcelColumns(),
        distanceKm: orders.distanceKm,
      })
      .from(orders)
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .innerJoin(packages, eq(packages.orderId, orders.orderId))
      // The final status is written to the history once, so this row is the moment it ended.
      .leftJoin(
        orderStatusHistory,
        and(
          eq(orderStatusHistory.orderId, orders.orderId),
          eq(orderStatusHistory.status, orders.status),
        ),
      )
      .where(
        and(
          eq(orders.orderId, orderId),
          eq(orders.courierId, courierProfileId),
          inArray(orders.status, [...HISTORY_STATUSES]),
        ),
      )
      .limit(SINGLE_ROW_LIMIT);

    if (!row) {
      throw new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return row;
  }
}
