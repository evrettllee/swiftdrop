import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { parcelColumns } from '../../../common/database/parcel-columns';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database } from '../../../database/database.module';
import { orders, packages } from '../../../database/schema';
import { aliasOrderAddresses } from '../../orders/utils/order-address-columns';
import type { DispatchOrder } from '../types/assignment.types';

@Injectable()
export class DispatchOrdersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // The points and the package of an order, or null when there is no such order.
  async load(orderId: number): Promise<DispatchOrder | null> {
    const { pickup, delivery } = aliasOrderAddresses();
    const [order] = await this.db
      .select({
        orderId: orders.orderId,
        pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
        delivery: { latitude: delivery.latitude, longitude: delivery.longitude },
        parcel: parcelColumns(),
      })
      .from(orders)
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .innerJoin(packages, eq(packages.orderId, orders.orderId))
      .where(eq(orders.orderId, orderId))
      .limit(SINGLE_ROW_LIMIT);

    return order ?? null;
  }
}
