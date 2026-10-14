import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  ROW_LOCK_NO_KEY_UPDATE,
  SINGLE_ROW_LIMIT,
} from '../../../common/constants/database.constants';
import { isLockTimeout } from '../../../common/database/pg-errors';
import { DRIZZLE } from '../../../database/database.constants';
import type { Database, Transaction } from '../../../database/database.module';
import { courierProfiles, vehicles } from '../../../database/schema';
import { COURIERS_ERROR_MESSAGES } from '../constants/couriers.constants';
import type { CourierMe } from '../types/couriers.types';
import { CourierProfilesService } from './courier-profiles.service';

@Injectable()
export class CourierAvailabilityService {
  private readonly logger = new Logger(CourierAvailabilityService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly profiles: CourierProfilesService,
  ) {}

  async set(userId: number, isAvailable: boolean): Promise<CourierMe> {
    try {
      await this.db.transaction((tx) => this.applyAvailability(tx, userId, isAvailable));
    } catch (error) {
      if (isLockTimeout(error)) {
        this.logger.warn(`Courier profile of user ${userId} is busy, availability change refused`);
        throw new ConflictException(COURIERS_ERROR_MESSAGES.BUSY);
      }

      throw error;
    }

    return this.profiles.getMe(userId);
  }

  // The profile row is locked like in a vehicle change, so a courier never ends up on shift
  // without a vehicle when both requests come at once.
  private async applyAvailability(
    tx: Transaction,
    userId: number,
    isAvailable: boolean,
  ): Promise<void> {
    await this.profiles.ensureProfile(userId, tx);

    const [profile] = await tx
      .select({ courierProfileId: courierProfiles.courierProfileId })
      .from(courierProfiles)
      .where(eq(courierProfiles.userId, userId))
      .limit(SINGLE_ROW_LIMIT)
      .for(ROW_LOCK_NO_KEY_UPDATE);

    if (!profile) {
      throw new NotFoundException(COURIERS_ERROR_MESSAGES.PROFILE_NOT_FOUND);
    }

    if (isAvailable && !(await this.hasVehicle(tx, profile.courierProfileId))) {
      throw new ConflictException(COURIERS_ERROR_MESSAGES.VEHICLE_REQUIRED);
    }

    // A courier off shift keeps no position: assignment must never use a stale one.
    const location = isAvailable
      ? {}
      : { currentLat: null, currentLng: null, locationUpdatedAt: null };

    await tx
      .update(courierProfiles)
      .set({ isAvailable, ...location })
      .where(eq(courierProfiles.courierProfileId, profile.courierProfileId));

    this.logger.log(`Courier ${profile.courierProfileId} is ${isAvailable ? 'on' : 'off'} shift`);
  }

  private async hasVehicle(tx: Transaction, courierProfileId: number): Promise<boolean> {
    const [vehicle] = await tx
      .select({ vehicleId: vehicles.vehicleId })
      .from(vehicles)
      .where(eq(vehicles.courierProfileId, courierProfileId))
      .limit(SINGLE_ROW_LIMIT);

    return vehicle !== undefined;
  }
}
