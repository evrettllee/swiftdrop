import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { withLockConflict } from '@/common/database/lock-conflict';
import { ROLE } from '@/common/enums/role.enum';
import { describeError } from '@/common/utils/describe-error';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { StaleOffersService } from '@/modules/assignment/services/stale-offers.service';
import { TokensService } from '@/modules/auth/services/tokens.service';
import { CourierAvailabilityService } from '@/modules/couriers/services/courier-availability.service';
import { CourierShiftEventsService } from '@/modules/couriers/services/courier-shift-events.service';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import {
  ADMIN_STAFF_LOG_MESSAGES as LOG,
  ADMIN_STAFF_MESSAGES,
} from '../constants/admin-staff.constants';
import {
  hasActiveCourierOrder,
  type LockedCourierProfile,
  lockCourierProfile,
} from '../utils/admin-access-queries';
import type { LockedTargetUser } from '../utils/admin-target-lock';

export type ShiftStop = { courierProfileId: number; wasAvailable: boolean };

@Injectable()
export class AdminAccessEffectsService {
  private readonly logger = new Logger(AdminAccessEffectsService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly tokens: TokensService,
    private readonly availability: CourierAvailabilityService,
    private readonly staleOffers: StaleOffersService,
    private readonly shiftEvents: CourierShiftEventsService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  inLockedTransaction<T>(userId: number, work: (tx: Transaction) => Promise<T>): Promise<T> {
    return withLockConflict(
      () => this.db.transaction(work),
      ADMIN_STAFF_MESSAGES.USER_BUSY,
      () => this.logger.warn(`${LOG.USER_BUSY}: user ${userId}`),
    );
  }

  async stopCourier(
    tx: Transaction,
    user: LockedTargetUser,
    activeOrderMessage: string,
  ): Promise<ShiftStop | null> {
    if (user.roleName !== ROLE.COURIER) {
      return null;
    }

    const profile = await lockCourierProfile(tx, user.userId);

    if (await hasActiveCourierOrder(tx, profile)) {
      throw new ConflictException(activeOrderMessage);
    }

    return this.takeOffShift(tx, profile);
  }

  async takeOffShift(
    tx: Transaction,
    profile: LockedCourierProfile | null,
  ): Promise<ShiftStop | null> {
    if (profile === null) {
      return null;
    }

    await this.availability.takeOffShift(tx, profile.courierProfileId);

    return { courierProfileId: profile.courierProfileId, wasAvailable: profile.isAvailable };
  }

  endSessions(tx: Transaction, userId: number): Promise<void> {
    return this.tokens.endAllSessions(userId, tx);
  }

  async afterCommit(userId: number, stop: ShiftStop | null): Promise<void> {
    this.realtime.disconnectUser(userId);

    if (stop === null) {
      return;
    }

    try {
      await this.staleOffers.close();
    } catch (error) {
      this.logger.error(`${LOG.OFFERS_CLOSE_FAILED}: user ${userId}, ${describeError(error)}`);
    }

    if (stop.wasAvailable) {
      this.shiftEvents.publish({ courierProfileId: stop.courierProfileId, isAvailable: false });
    }
  }
}
