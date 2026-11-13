import { ConflictException, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { withLockConflict } from '@/common/database/lock-conflict';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { ROLE } from '@/common/enums/role.enum';
import { DRIZZLE } from '@/database/database.constants';
import type { Database } from '@/database/database.module';
import { UsersService } from '@/modules/users/services/users.service';
import {
  ADMIN_STAFF_LOG_MESSAGES as LOG,
  ADMIN_STAFF_MESSAGES,
  STAFF_EDITABLE_FIELDS,
} from '../constants/admin-staff.constants';
import type { UpdateStaffDto } from '../dto/admin-staff.dto';
import type { AdminUserCard } from '../types/admin-users.types';
import { recordUserAction } from '../utils/admin-action-log';
import { type LockedTargetUser, lockTargetUser } from '../utils/admin-target-lock';
import { AdminUserCardService } from './admin-user-card.service';

type EditableField = (typeof STAFF_EDITABLE_FIELDS)[number];

function changedFields(user: LockedTargetUser, dto: UpdateStaffDto): EditableField[] {
  return STAFF_EDITABLE_FIELDS.filter((field) => {
    const value = dto[field];

    return value !== undefined && value !== user[field];
  });
}

function ensureEditable(user: LockedTargetUser): void {
  if (user.roleName === ROLE.CLIENT) {
    throw new ForbiddenException(ADMIN_STAFF_MESSAGES.CLIENT_EDIT_FORBIDDEN);
  }

  if (user.deletedAt !== null) {
    throw new ConflictException(ADMIN_STAFF_MESSAGES.USER_DELETED);
  }
}

@Injectable()
export class AdminStaffUpdatesService {
  private readonly logger = new Logger(AdminStaffUpdatesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly users: UsersService,
    private readonly cards: AdminUserCardService,
  ) {}

  async update(adminId: number, userId: number, dto: UpdateStaffDto): Promise<AdminUserCard> {
    await withLockConflict(
      () =>
        this.db.transaction(async (tx) => {
          const user = await lockTargetUser(tx, userId);

          ensureEditable(user);

          const fields = changedFields(user, dto);

          if (fields.length === 0) {
            return;
          }

          await this.users.updateFields(
            userId,
            Object.fromEntries(fields.map((field) => [field, dto[field]])),
            tx,
          );
          await recordUserAction(tx, {
            actorId: adminId,
            targetUserId: userId,
            action: ADMIN_ACTION.USER_UPDATED,
            details: { fields },
          });
        }),
      ADMIN_STAFF_MESSAGES.USER_BUSY,
      () => this.logger.warn(`${LOG.USER_BUSY}: user ${userId}`),
    );

    return this.cards.get(userId);
  }
}
