import { ConflictException, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { withLockConflict } from '@/common/database/lock-conflict';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { courierProfiles, courierShifts, roles, users, vehicles } from '@/database/schema';
import { FORBIDDEN_MESSAGE } from '@/modules/auth/constants/access.constants';
import { COURIERS_ERROR_MESSAGES } from '../constants/couriers.constants';
import type { CourierMe, CourierShiftEvent } from '../types/couriers.types';
import { CourierProfilesService } from './courier-profiles.service';
import { CourierShiftEventsService } from './courier-shift-events.service';

@Injectable()
export class CourierAvailabilityService {
  private readonly logger = new Logger(CourierAvailabilityService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly profiles: CourierProfilesService,
    private readonly shiftEvents: CourierShiftEventsService,
  ) {}

  async set(userId: number, isAvailable: boolean): Promise<CourierMe> {
    const change = await withLockConflict(
      () => this.db.transaction((tx) => this.applyAvailability(tx, userId, isAvailable)),
      COURIERS_ERROR_MESSAGES.BUSY,
      () =>
        this.logger.warn(`Courier profile of user ${userId} is busy, availability change refused`),
    );

    if (change) {
      this.shiftEvents.publish(change);
    }

    return this.profiles.getMe(userId);
  }

  // The profile row is locked like in a vehicle change, so a courier never ends up on shift
  // without a vehicle when both requests come at once. Accepting an offer locks the same row, so
  // an order cannot be taken between the check of active orders and going off shift.
  private async applyAvailability(
    tx: Transaction,
    userId: number,
    isAvailable: boolean,
  ): Promise<CourierShiftEvent | null> {
    const profile = await this.profiles.lockOwnProfile(tx, userId);

    if (isAvailable && !(await this.isCourier(tx, userId))) {
      throw new ForbiddenException(FORBIDDEN_MESSAGE);
    }

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
    if (isAvailable) {
      await tx
        .update(courierProfiles)
        .set({ isAvailable })
        .where(eq(courierProfiles.courierProfileId, profile.courierProfileId));
      await this.recordShift(tx, profile.courierProfileId, isAvailable, profile.isAvailable);
    } else {
      await this.takeOffShift(tx, profile.courierProfileId);
    }

    this.logger.log(`Courier ${profile.courierProfileId} is ${isAvailable ? 'on' : 'off'} shift`);

    return profile.isAvailable === isAvailable
      ? null
      : { courierProfileId: profile.courierProfileId, isAvailable };
  }

  async takeOffShift(tx: Transaction, courierProfileId: number): Promise<void> {
    await tx
      .update(courierProfiles)
      .set({ isAvailable: false, currentLat: null, currentLng: null, locationUpdatedAt: null })
      .where(eq(courierProfiles.courierProfileId, courierProfileId));
    await this.recordShift(tx, courierProfileId, false, true);
  }

  private async isCourier(tx: Transaction, userId: number): Promise<boolean> {
    const [row] = await tx
      .select({ roleName: roles.name })
      .from(users)
      .innerJoin(roles, eq(roles.roleId, users.roleId))
      .where(eq(users.userId, userId))
      .limit(SINGLE_ROW_LIMIT);

    return row?.roleName === ROLE.COURIER;
  }

  private async recordShift(
    tx: Transaction,
    courierId: number,
    isAvailable: boolean,
    wasAvailable: boolean,
  ): Promise<void> {
    if (!isAvailable) {
      await tx
        .update(courierShifts)
        .set({ endedAt: sql`now()` })
        .where(and(eq(courierShifts.courierId, courierId), isNull(courierShifts.endedAt)));

      return;
    }

    if (!wasAvailable) {
      await tx
        .insert(courierShifts)
        .values({ courierId, startedAt: sql`now()` })
        .onConflictDoNothing();
    }
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
