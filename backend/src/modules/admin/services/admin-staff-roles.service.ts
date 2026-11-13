import { ConflictException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import type { Transaction } from '@/database/database.module';
import type { InvitableRole } from '@/modules/auth/constants/mail.constants';
import { UsersService } from '@/modules/users/services/users.service';
import {
  ADMIN_ROLE_MESSAGES,
  ADMIN_STAFF_LOG_MESSAGES as LOG,
  ADMIN_STAFF_MESSAGES,
} from '../constants/admin-staff.constants';
import type { AdminUserCard } from '../types/admin-users.types';
import { hasActiveCourierOrder, lockCourierProfile } from '../utils/admin-access-queries';
import { recordUserAction } from '../utils/admin-action-log';
import { type LockedTargetUser, lockTargetUser } from '../utils/admin-target-lock';
import { AdminAccessEffectsService, type ShiftStop } from './admin-access-effects.service';
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
    private readonly users: UsersService,
    private readonly effects: AdminAccessEffectsService,
    private readonly cards: AdminUserCardService,
  ) {}

  async change(adminId: number, userId: number, to: InvitableRole): Promise<AdminUserCard> {
    const { change, stop } = await this.effects.inLockedTransaction(userId, (tx) =>
      this.applyChange(tx, adminId, userId, to),
    );

    await this.effects.afterCommit(userId, stop);
    this.logger.log(`${LOG.ROLE_CHANGED}: user ${userId}, ${change.from} to ${change.to}`);

    return this.cards.get(userId);
  }

  private async applyChange(
    tx: Transaction,
    adminId: number,
    userId: number,
    to: InvitableRole,
  ): Promise<{ change: RoleChange; stop: ShiftStop | null }> {
    const change = roleChangeOf(await lockTargetUser(tx, userId), to);
    const profile = await lockCourierProfile(tx, userId);

    if (await hasActiveCourierOrder(tx, profile)) {
      throw new ConflictException(ADMIN_ROLE_MESSAGES.ACTIVE_ORDER);
    }

    const stop = await this.effects.takeOffShift(tx, profile);

    await this.users.changeRole(userId, to, tx);
    await this.effects.endSessions(tx, userId);
    await recordUserAction(tx, {
      actorId: adminId,
      targetUserId: userId,
      action: ADMIN_ACTION.ROLE_CHANGED,
      details: change,
    });

    return { change, stop };
  }
}
