import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { users } from '@/database/schema';
import { PasswordLinksService } from '@/modules/auth/services/password-links.service';
import {
  ADMIN_ACCESS_LOG_MESSAGES as LOG,
  ADMIN_ACCESS_MESSAGES,
} from '../constants/admin-access.constants';
import { ADMIN_STAFF_MESSAGES } from '../constants/admin-staff.constants';
import { USER_STATUS } from '../constants/admin-users.constants';
import type { AdminUserCard, UserStatus } from '../types/admin-users.types';
import {
  hasActiveCourierOrder,
  hasOpenClientOrder,
  lockCourierProfile,
} from '../utils/admin-access-queries';
import { recordUserAction } from '../utils/admin-action-log';
import { type LockedTargetUser, lockTargetUser } from '../utils/admin-target-lock';
import { deriveUserStatus } from '../utils/user-status';
import { AdminAccessEffectsService, type ShiftStop } from './admin-access-effects.service';
import { AdminUserCardService } from './admin-user-card.service';

const BLOCK_REFUSALS: Partial<Record<UserStatus, string>> = {
  [USER_STATUS.DELETED]: ADMIN_STAFF_MESSAGES.USER_DELETED,
  [USER_STATUS.BLOCKED]: ADMIN_ACCESS_MESSAGES.ALREADY_BLOCKED,
  [USER_STATUS.INVITED]: ADMIN_ACCESS_MESSAGES.BLOCK_INVITED,
};

const SESSIONS_REFUSALS: Partial<Record<UserStatus, string>> = {
  [USER_STATUS.DELETED]: ADMIN_STAFF_MESSAGES.USER_DELETED,
  [USER_STATUS.INVITED]: ADMIN_ACCESS_MESSAGES.SESSIONS_INVITED,
};

function refuseByStatus(user: LockedTargetUser, refusals: Partial<Record<UserStatus, string>>) {
  const message = refusals[deriveUserStatus(user)];

  if (message !== undefined) {
    throw new ConflictException(message);
  }
}

@Injectable()
export class AdminUserAccessService {
  private readonly logger = new Logger(AdminUserAccessService.name);

  constructor(
    private readonly effects: AdminAccessEffectsService,
    private readonly links: PasswordLinksService,
    private readonly cards: AdminUserCardService,
  ) {}

  async block(adminId: number, userId: number, reason: string): Promise<AdminUserCard> {
    const stop = await this.effects.inLockedTransaction(userId, async (tx) => {
      const user = await lockTargetUser(tx, userId);

      refuseByStatus(user, BLOCK_REFUSALS);

      const shiftStop = await this.effects.stopCourier(
        tx,
        user,
        ADMIN_ACCESS_MESSAGES.BLOCK_ACTIVE_ORDER,
      );

      if (user.roleName === ROLE.CLIENT && (await hasOpenClientOrder(tx, userId))) {
        throw new ConflictException(ADMIN_ACCESS_MESSAGES.BLOCK_ACTIVE_ORDER);
      }

      await tx.update(users).set({ isBlocked: true }).where(eq(users.userId, userId));
      await this.effects.endSessions(tx, userId);
      await this.links.invalidateAll(tx, userId);
      await recordUserAction(tx, {
        actorId: adminId,
        targetUserId: userId,
        action: ADMIN_ACTION.USER_BLOCKED,
        details: { reason },
      });

      return shiftStop;
    });

    return this.finish(userId, stop, LOG.USER_BLOCKED);
  }

  async unblock(adminId: number, userId: number): Promise<AdminUserCard> {
    await this.effects.inLockedTransaction(userId, async (tx) => {
      const user = await lockTargetUser(tx, userId);

      if (user.deletedAt !== null) {
        throw new ConflictException(ADMIN_STAFF_MESSAGES.USER_DELETED);
      }

      if (!user.isBlocked) {
        throw new ConflictException(ADMIN_ACCESS_MESSAGES.NOT_BLOCKED);
      }

      await tx.update(users).set({ isBlocked: false }).where(eq(users.userId, userId));
      await recordUserAction(tx, {
        actorId: adminId,
        targetUserId: userId,
        action: ADMIN_ACTION.USER_UNBLOCKED,
        details: {},
      });
    });
    this.logger.log(`${LOG.USER_UNBLOCKED}: user ${userId}`);

    return this.cards.get(userId);
  }

  async endSessions(adminId: number, userId: number): Promise<AdminUserCard> {
    const stop = await this.effects.inLockedTransaction(userId, async (tx) => {
      const user = await lockTargetUser(tx, userId);

      refuseByStatus(user, SESSIONS_REFUSALS);

      const profile = user.roleName === ROLE.COURIER ? await lockCourierProfile(tx, userId) : null;
      const shiftStop = (await hasActiveCourierOrder(tx, profile))
        ? null
        : await this.effects.takeOffShift(tx, profile);

      await this.effects.endSessions(tx, userId);
      await recordUserAction(tx, {
        actorId: adminId,
        targetUserId: userId,
        action: ADMIN_ACTION.SESSIONS_ENDED,
        details: {},
      });

      return shiftStop;
    });

    return this.finish(userId, stop, LOG.SESSIONS_ENDED);
  }

  private async finish(userId: number, stop: ShiftStop | null, log: string) {
    await this.effects.afterCommit(userId, stop);
    this.logger.log(`${log}: user ${userId}`);

    return this.cards.get(userId);
  }
}
