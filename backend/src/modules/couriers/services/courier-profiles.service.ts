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
import type { CourierMe, CourierProfileRow, LockedProfile } from '../types/couriers.types';

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

  // Every courier request starts here, so the profile is read first and inserted only on the
  // first visit: a read request writes nothing.
  async getProfileId(userId: number): Promise<number> {
    const profileId = await this.findOrCreate(userId, () => this.findProfileId(userId));

    if (profileId === null) {
      throw new NotFoundException(COURIERS_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    return profileId;
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
    const row = await this.findOrCreate(userId, () => this.findProfileRow(userId));

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

  // Reads the profile, and only when there is none yet creates it and reads again.
  private async findOrCreate<T>(userId: number, read: () => Promise<T | null>): Promise<T | null> {
    const found = await read();

    if (found !== null) {
      return found;
    }

    await this.ensureProfile(userId);

    return read();
  }

  private async findProfileId(userId: number): Promise<number | null> {
    const [profile] = await this.db
      .select({ courierProfileId: courierProfiles.courierProfileId })
      .from(courierProfiles)
      .where(eq(courierProfiles.userId, userId))
      .limit(SINGLE_ROW_LIMIT);

    return profile?.courierProfileId ?? null;
  }

  private async findProfileRow(userId: number): Promise<CourierProfileRow | null> {
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

    return row ?? null;
  }
}
