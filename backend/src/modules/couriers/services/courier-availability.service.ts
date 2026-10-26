import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { withLockConflict } from '@/common/database/lock-conflict';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { courierProfiles, vehicles } from '@/database/schema';
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
    await withLockConflict(
      () => this.db.transaction((tx) => this.applyAvailability(tx, userId, isAvailable)),
      COURIERS_ERROR_MESSAGES.BUSY,
      () =>
        this.logger.warn(`Courier profile of user ${userId} is busy, availability change refused`),
    );

    return this.profiles.getMe(userId);
  }

  // The profile row is locked like in a vehicle change, so a courier never ends up on shift
  // without a vehicle when both requests come at once. Accepting an offer locks the same row, so
  // an order cannot be taken between the check of active orders and going off shift.
  private async applyAvailability(
    tx: Transaction,
    userId: number,
    isAvailable: boolean,
  ): Promise<void> {
    const profile = await this.profiles.lockOwnProfile(tx, userId);

    if (isAvailable && !(await this.hasVehicle(tx, profile.courierProfileId))) {
      throw new ConflictException(COURIERS_ERROR_MESSAGES.VEHICLE_REQUIRED);
    }

    // The client follows the courier until the order is over, so the courier stays on the line.
    if (
      !isAvailable &&
      (await this.profiles.findActiveOrderId(profile.courierProfileId, tx)) !== null
    ) {
      throw new ConflictException(COURIERS_ERROR_MESSAGES.ACTIVE_ORDER);
    }

    // A courier off shift keeps no position: assignment must never use a stale one. Only reached
    // without an active order, so a tracked courier never loses the position.
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
