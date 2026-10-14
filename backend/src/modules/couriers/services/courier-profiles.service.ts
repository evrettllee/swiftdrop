import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '../../../common/constants/database.constants';
import { COURIER_ACTIVE_ORDER_STATUSES } from '../../../common/constants/orders.constants';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database, Transaction } from '../../../database/database.module';
import { courierProfiles, orders, vehicles } from '../../../database/schema';
import { COURIERS_ERROR_MESSAGES } from '../constants/couriers.constants';
import { toCourierMe } from '../mappers/courier-profile.mapper';
import type { CourierMe } from '../types/couriers.types';

@Injectable()
export class CourierProfilesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  // A courier account gets its profile on the first visit; a repeated call changes nothing.
  async ensureProfile(userId: number, executor: Database | Transaction = this.db): Promise<void> {
    await executor
      .insert(courierProfiles)
      .values({ userId })
      .onConflictDoNothing({ target: courierProfiles.userId });
  }

  async getProfileId(userId: number): Promise<number> {
    await this.ensureProfile(userId);

    const [profile] = await this.db
      .select({ courierProfileId: courierProfiles.courierProfileId })
      .from(courierProfiles)
      .where(eq(courierProfiles.userId, userId))
      .limit(SINGLE_ROW_LIMIT);

    if (!profile) {
      throw new NotFoundException(COURIERS_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    return profile.courierProfileId;
  }

  async getMe(userId: number): Promise<CourierMe> {
    await this.ensureProfile(userId);

    const [row] = await this.db
      .select({
        courierProfileId: courierProfiles.courierProfileId,
        isAvailable: courierProfiles.isAvailable,
        vehicleType: vehicles.type,
        brand: vehicles.brand,
        model: vehicles.model,
        licensePlate: vehicles.licensePlate,
      })
      .from(courierProfiles)
      .leftJoin(vehicles, eq(vehicles.courierProfileId, courierProfiles.courierProfileId))
      .where(eq(courierProfiles.userId, userId))
      .limit(SINGLE_ROW_LIMIT);

    if (!row) {
      throw new NotFoundException(COURIERS_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    return toCourierMe(row, await this.findActiveOrderId(row.courierProfileId));
  }

  // The order the courier carries now, at most one by the unique index of the orders table.
  async findActiveOrderId(
    courierProfileId: number,
    executor: Database | Transaction = this.db,
  ): Promise<number | null> {
    const [order] = await executor
      .select({ orderId: orders.orderId })
      .from(orders)
      .where(
        and(
          eq(orders.courierId, courierProfileId),
          inArray(orders.status, [...COURIER_ACTIVE_ORDER_STATUSES]),
        ),
      )
      .limit(SINGLE_ROW_LIMIT);

    return order?.orderId ?? null;
  }
}
