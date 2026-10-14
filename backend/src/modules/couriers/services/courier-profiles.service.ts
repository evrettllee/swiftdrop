import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  ROW_LOCK_NO_KEY_UPDATE,
  SINGLE_ROW_LIMIT,
} from '../../../common/constants/database.constants';
import { courierActiveOrder } from '../../../common/database/courier-active-order';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database, Transaction } from '../../../database/database.module';
import { courierProfiles, orders, vehicles } from '../../../database/schema';
import { COURIERS_ERROR_MESSAGES } from '../constants/couriers.constants';
import { toCourierMe } from '../mappers/courier-profile.mapper';
import type { CourierMe, LockedProfile } from '../types/couriers.types';

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

  // The profile of the user, locked until the commit: going on shift and a vehicle change wait
  // for each other, so neither works on a state the other is changing.
  async lockOwnProfile(tx: Transaction, userId: number): Promise<LockedProfile> {
    await this.ensureProfile(userId, tx);

    const [profile] = await tx
      .select({
        courierProfileId: courierProfiles.courierProfileId,
        isAvailable: courierProfiles.isAvailable,
      })
      .from(courierProfiles)
      .where(eq(courierProfiles.userId, userId))
      .limit(SINGLE_ROW_LIMIT)
      .for(ROW_LOCK_NO_KEY_UPDATE);

    if (!profile) {
      throw new NotFoundException(COURIERS_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    return profile;
  }

  // Whether the courier is on shift, with the profile locked until the commit, so going off shift
  // waits for the caller and then sees what it did.
  async lockIsAvailable(tx: Transaction, courierProfileId: number): Promise<boolean> {
    const [profile] = await tx
      .select({ isAvailable: courierProfiles.isAvailable })
      .from(courierProfiles)
      .where(eq(courierProfiles.courierProfileId, courierProfileId))
      .limit(SINGLE_ROW_LIMIT)
      .for(ROW_LOCK_NO_KEY_UPDATE);

    return profile?.isAvailable ?? false;
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
      .where(courierActiveOrder(courierProfileId))
      .limit(SINGLE_ROW_LIMIT);

    return order?.orderId ?? null;
  }
}
