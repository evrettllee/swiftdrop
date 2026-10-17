import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, type SQL } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { courierActiveOrder } from '../../../common/database/courier-active-order';
import { parcelColumns } from '../../../common/database/parcel-columns';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { orders, packages, users } from '../../../database/schema';
import { addressPointColumns, aliasOrderAddresses } from '../../orders/utils/order-address-columns';
import { DELIVERIES_ERROR_MESSAGES } from '../constants/deliveries.constants';
import { toCourierOrder } from '../mappers/courier-order.mapper';
import type { CourierOrder } from '../types/deliveries.types';

@Injectable()
export class CourierOrderViewsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // The order the courier carries now, at most one by the unique index of the orders table.
  findActive(courierProfileId: number): Promise<CourierOrder | null> {
    return this.findOne(courierActiveOrder(courierProfileId));
  }

  // An order of the courier at any stage; someone else's order looks the same as a missing one.
  async getOfCourier(orderId: number, courierProfileId: number): Promise<CourierOrder> {
    const order = await this.findOne(
      and(eq(orders.orderId, orderId), eq(orders.courierId, courierProfileId)),
    );

    if (!order) {
      throw new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return order;
  }

  private async findOne(condition: SQL | undefined): Promise<CourierOrder | null> {
    const { pickup, delivery } = aliasOrderAddresses();
    const [row] = await this.db
      .select({
        orderId: orders.orderId,
        status: orders.status,
        pickup: addressPointColumns(pickup),
        delivery: addressPointColumns(delivery),
        sender: { firstName: users.firstName, lastName: users.lastName, phone: users.phone },
        recipient: { name: orders.recipientName, phone: orders.recipientPhone },
        parcel: parcelColumns(),
        distanceKm: orders.distanceKm,
      })
      .from(orders)
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .innerJoin(users, eq(users.userId, orders.clientId))
      .innerJoin(packages, eq(packages.orderId, orders.orderId))
      .where(condition)
      .limit(SINGLE_ROW_LIMIT);

    return row ? toCourierOrder(row) : null;
  }
}
