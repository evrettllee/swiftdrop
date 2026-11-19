import { ConflictException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { users } from '@/database/schema';
import { buildPasswordResetByAdminMail } from '@/modules/auth/mail/password-reset-by-admin.mail';
import { PasswordLinksService } from '@/modules/auth/services/password-links.service';
import {
  ADMIN_ACCESS_LOG_MESSAGES as LOG,
  ADMIN_ACCESS_MESSAGES,
} from '../constants/admin-access.constants';
import { ADMIN_STAFF_MESSAGES } from '../constants/admin-staff.constants';
import { USER_STATUS } from '../constants/admin-users.constants';
import type { StaffInviteResult } from '../types/admin-staff.types';
import type { UserStatus } from '../types/admin-users.types';
import { recordUserAction } from '../utils/admin-action-log';
import { type LockedTargetUser, lockTargetUser } from '../utils/admin-target-lock';
import { deriveUserStatus } from '../utils/user-status';
import { AdminAccessEffectsService } from './admin-access-effects.service';
import { AdminLinkMailService } from './admin-link-mail.service';

const RESET_REFUSALS: Partial<Record<UserStatus, string>> = {
  [USER_STATUS.DELETED]: ADMIN_STAFF_MESSAGES.USER_DELETED,
  [USER_STATUS.BLOCKED]: ADMIN_ACCESS_MESSAGES.RESET_BLOCKED,
  [USER_STATUS.INVITED]: ADMIN_ACCESS_MESSAGES.RESET_INVITED,
};

function ensureResettable(user: LockedTargetUser): void {
  if (user.roleName === ROLE.CLIENT) {
    throw new ForbiddenException(ADMIN_ACCESS_MESSAGES.RESET_CLIENT);
  }

  const message = RESET_REFUSALS[deriveUserStatus(user)];

  if (message !== undefined) {
    throw new ConflictException(message);
  }
}

@Injectable()
export class AdminPasswordResetService {
  private readonly logger = new Logger(AdminPasswordResetService.name);

  constructor(
    private readonly effects: AdminAccessEffectsService,
    private readonly links: PasswordLinksService,
    private readonly linkMail: AdminLinkMailService,
  ) {}

  async reset(adminId: number, userId: number): Promise<StaffInviteResult> {
    const { user, link, stop } = await this.effects.inLockedTransaction(userId, async (tx) => {
      const target = await lockTargetUser(tx, userId);

      ensureResettable(target);

      const shiftStop = await this.effects.stopCourier(
        tx,
        target,
        ADMIN_ACCESS_MESSAGES.RESET_ACTIVE_ORDER,
      );

      await tx.update(users).set({ passwordHash: null }).where(eq(users.userId, userId));
      await this.effects.endSessions(tx, userId);

      const issued = await this.links.issue(tx, {
        userId,
        kind: TOKEN_KIND.RESET,
        createdBy: adminId,
      });

      await recordUserAction(tx, {
        actorId: adminId,
        targetUserId: userId,
        action: ADMIN_ACTION.PASSWORD_RESET,
        details: {},
      });

      return { user: target, link: issued, stop: shiftStop };
    });

    const result = await this.linkMail.deliver(user, link, (setPasswordUrl) =>
      buildPasswordResetByAdminMail({
        to: user.email,
        firstName: user.firstName,
        link: setPasswordUrl,
        expiresAt: link.expiresAt,
      }),
    );

    await this.effects.afterCommit(userId, stop);
    this.logger.log(`${LOG.PASSWORD_RESET}: user ${userId}`);

    return result;
  }
}
