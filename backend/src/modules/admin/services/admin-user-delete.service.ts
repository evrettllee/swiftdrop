import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { ROW_LOCK_UPDATE } from '@/common/constants/database.constants';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import type { Transaction } from '@/database/database.module';
import {
  courierProfiles,
  emailVerificationTokens,
  notifications,
  userOauthAccounts,
  users,
  vehicles,
} from '@/database/schema';
import { PasswordLinksService } from '@/modules/auth/services/password-links.service';
import {
  ADMIN_DELETE_LOG_MESSAGES as LOG,
  ADMIN_DELETE_MESSAGES,
  DELETED_USER_FIRST_NAME,
  DELETED_USER_LAST_NAME,
  deletedUserEmail,
} from '../constants/admin-delete.constants';
import type { AdminUserCard } from '../types/admin-users.types';
import { recordUserAction } from '../utils/admin-action-log';
import { lockTargetUser } from '../utils/admin-target-lock';
import { AdminAccessEffectsService } from './admin-access-effects.service';
import { AdminUserCardService } from './admin-user-card.service';

async function anonymize(tx: Transaction, userId: number): Promise<void> {
  await tx
    .update(users)
    .set({
      firstName: DELETED_USER_FIRST_NAME,
      lastName: DELETED_USER_LAST_NAME,
      email: deletedUserEmail(userId),
      phone: null,
      passwordHash: null,
      deletedAt: sql`now()`,
    })
    .where(eq(users.userId, userId));
  await tx.delete(userOauthAccounts).where(eq(userOauthAccounts.userId, userId));
  await tx.delete(notifications).where(eq(notifications.userId, userId));
  await tx.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));

  const [profile] = await tx
    .update(courierProfiles)
    .set({ avatarUrl: null })
    .where(eq(courierProfiles.userId, userId))
    .returning({ courierProfileId: courierProfiles.courierProfileId });

  if (profile) {
    await tx
      .update(vehicles)
      .set({ licensePlate: null })
      .where(eq(vehicles.courierProfileId, profile.courierProfileId));
  }
}

@Injectable()
export class AdminUserDeleteService {
  private readonly logger = new Logger(AdminUserDeleteService.name);

  constructor(
    private readonly effects: AdminAccessEffectsService,
    private readonly links: PasswordLinksService,
    private readonly cards: AdminUserCardService,
  ) {}

  async delete(adminId: number, userId: number): Promise<AdminUserCard> {
    const stop = await this.effects.inLockedTransaction(userId, async (tx) => {
      const user = await lockTargetUser(tx, userId, ROW_LOCK_UPDATE);

      if (user.deletedAt !== null) {
        throw new ConflictException(ADMIN_DELETE_MESSAGES.ALREADY_DELETED);
      }

      const shiftStop = await this.effects.stopUser(tx, user, ADMIN_DELETE_MESSAGES.ACTIVE_ORDER);

      await anonymize(tx, userId);
      await this.effects.endSessions(tx, userId);
      await this.links.invalidateAll(tx, userId);
      await recordUserAction(tx, {
        actorId: adminId,
        targetUserId: userId,
        action: ADMIN_ACTION.USER_DELETED,
        details: {},
      });

      return shiftStop;
    });

    await this.effects.afterCommit(userId, stop);
    this.logger.log(`${LOG.USER_DELETED}: user ${userId}`);

    return this.cards.get(userId);
  }
}
