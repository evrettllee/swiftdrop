import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { ROW_LOCK_NO_KEY_UPDATE, SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import type { OrderStatus } from '@/common/enums/order-status.enum';
import { positionAgeMsSql } from '@/common/database/position-age';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { courierProfiles, orders, vehicles } from '@/database/schema';
import { aliasOrderAddresses } from '@/modules/orders/utils/order-address-columns';
import type { EtaSource } from '../types/tracking.types';

// The database side of the arrival estimate.
@Injectable()
export class OrderEtaDataService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // The order, its points and its courier in one query, or null when the order is gone.
  async load(orderId: number): Promise<EtaSource | null> {
    const { pickup, delivery } = aliasOrderAddresses();
    const [row] = await this.db
      .select({
        status: orders.status,
        pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
        delivery: { latitude: delivery.latitude, longitude: delivery.longitude },
        vehicleType: vehicles.type,
        currentLat: courierProfiles.currentLat,
        currentLng: courierProfiles.currentLng,
        locationUpdatedAt: courierProfiles.locationUpdatedAt,
        positionAgeMs: positionAgeMsSql(courierProfiles.locationUpdatedAt),
      })
      .from(orders)
      .innerJoin(pickup, eq(pickup.addressId, orders.pickupAddressId))
      .innerJoin(delivery, eq(delivery.addressId, orders.deliveryAddressId))
      .leftJoin(courierProfiles, eq(courierProfiles.courierProfileId, orders.courierId))
      .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
      .where(eq(orders.orderId, orderId))
      .limit(SINGLE_ROW_LIMIT);

    if (!row) {
      return null;
    }

    const { currentLat, currentLng, ...rest } = row;
    const position =
      currentLat === null || currentLng === null
        ? null
        : { latitude: currentLat, longitude: currentLng };

    return { ...rest, position };
  }

  // Saves the estimate only while the order is still in the status it was made for. A row held by
  // a change of the status is skipped at once instead of waiting for the lock: that change brings
  // its own estimate. Null when nothing was saved.
  async save(
    orderId: number,
    status: OrderStatus,
    estimatedDeliveryAt: Date,
  ): Promise<Date | null> {
    const lockable = this.db
      .select({ orderId: orders.orderId })
      .from(orders)
      .where(and(eq(orders.orderId, orderId), eq(orders.status, status)))
      .for(ROW_LOCK_NO_KEY_UPDATE, { skipLocked: true });
    const [saved] = await this.db
      .update(orders)
      .set({ estimatedDeliveryAt })
      .where(inArray(orders.orderId, lockable))
      .returning({ estimatedDeliveryAt: orders.estimatedDeliveryAt });

    return saved?.estimatedDeliveryAt ?? null;
  }
}
