import { ConflictException, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ROW_LOCK_UPDATE, SINGLE_ROW_LIMIT } from '@/common/constants/database.constants';
import { withLockConflict } from '@/common/database/lock-conflict';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { describeError } from '@/common/utils/describe-error';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { courierProfiles } from '@/database/schema';
import { StaleOffersService } from '@/modules/assignment/services/stale-offers.service';
import type { InvitableRole } from '@/modules/auth/constants/mail.constants';
import { TokensService } from '@/modules/auth/services/tokens.service';
import { CourierAvailabilityService } from '@/modules/couriers/services/courier-availability.service';
import { CourierProfilesService } from '@/modules/couriers/services/courier-profiles.service';
import { RealtimeEventsService } from '@/modules/realtime/services/realtime-events.service';
import { UsersService } from '@/modules/users/services/users.service';
import {
  ADMIN_ROLE_MESSAGES,
  ADMIN_STAFF_LOG_MESSAGES as LOG,
  ADMIN_STAFF_MESSAGES,
} from '../constants/admin-staff.constants';
import type { AdminUserCard } from '../types/admin-users.types';
import { recordUserAction } from '../utils/admin-action-log';
import { type LockedTargetUser, lockTargetUser } from '../utils/admin-target-lock';
import { AdminUserCardService } from './admin-user-card.service';

type RoleChange = { from: InvitableRole; to: InvitableRole };

function roleChangeOf(user: LockedTargetUser, to: InvitableRole): RoleChange {
  if (user.roleName === ROLE.CLIENT) {
    throw new ForbiddenException(ADMIN_ROLE_MESSAGES.CLIENT_ROLE_LOCKED);
  }

  if (user.deletedAt !== null) {
    throw new ConflictException(ADMIN_STAFF_MESSAGES.USER_DELETED);
  }

  if (user.roleName === to) {
    throw new ConflictException(ADMIN_ROLE_MESSAGES.SAME_ROLE);
  }

  return { from: to === ROLE.COURIER ? ROLE.MANAGER : ROLE.COURIER, to };
}

@Injectable()
export class AdminStaffRolesService {
  private readonly logger = new Logger(AdminStaffRolesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly users: UsersService,
    private readonly tokens: TokensService,
    private readonly profiles: CourierProfilesService,
    private readonly availability: CourierAvailabilityService,
    private readonly staleOffers: StaleOffersService,
    private readonly realtime: RealtimeEventsService,
    private readonly cards: AdminUserCardService,
  ) {}

  async change(adminId: number, userId: number, to: InvitableRole): Promise<AdminUserCard> {
    const change = await withLockConflict(
      () => this.db.transaction((tx) => this.applyChange(tx, adminId, userId, to)),
      ADMIN_STAFF_MESSAGES.USER_BUSY,
      () => this.logger.warn(`${LOG.USER_BUSY}: user ${userId}`),
    );

    this.realtime.disconnectUser(userId);
    this.logger.log(`${LOG.ROLE_CHANGED}: user ${userId}, ${change.from} to ${change.to}`);

    if (change.from === ROLE.COURIER) {
      await this.closeOpenOffers(userId);
    }

    return this.cards.get(userId);
  }

  private async applyChange(
    tx: Transaction,
    adminId: number,
    userId: number,
    to: InvitableRole,
  ): Promise<RoleChange> {
    const change = roleChangeOf(await lockTargetUser(tx, userId), to);
    const profileId = await this.lockProfile(tx, userId);

    if (profileId !== null) {
      if ((await this.profiles.findActiveOrderId(profileId, tx)) !== null) {
        throw new ConflictException(ADMIN_ROLE_MESSAGES.ACTIVE_ORDER);
      }

      await this.availability.takeOffShift(tx, profileId);
    }

    await this.users.changeRole(userId, to, tx);
    await this.tokens.revokeAllForUser(userId, tx);
    await recordUserAction(tx, {
      actorId: adminId,
      targetUserId: userId,
      action: ADMIN_ACTION.ROLE_CHANGED,
      details: change,
    });

    return change;
  }

  private async lockProfile(tx: Transaction, userId: number): Promise<number | null> {
    const [profile] = await tx
      .select({ courierProfileId: courierProfiles.courierProfileId })
      .from(courierProfiles)
      .where(eq(courierProfiles.userId, userId))
      .limit(SINGLE_ROW_LIMIT)
      .for(ROW_LOCK_UPDATE);

    return profile?.courierProfileId ?? null;
  }

  private async closeOpenOffers(userId: number): Promise<void> {
    try {
      await this.staleOffers.close();
    } catch (error) {
      this.logger.error(`${LOG.OFFERS_CLOSE_FAILED}: user ${userId}, ${describeError(error)}`);
    }
  }
}
