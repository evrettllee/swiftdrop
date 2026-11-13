import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { withLockConflict } from '@/common/database/lock-conflict';
import { ADMIN_ACTION } from '@/common/enums/admin-action.enum';
import { TOKEN_KIND } from '@/common/enums/token-kind.enum';
import { ENV_KEYS } from '@/config/env.constants';
import { DRIZZLE } from '@/database/database.constants';
import type { Database, Transaction } from '@/database/database.module';
import { MailGateway } from '@/integrations/mail/contracts/mail.gateway';
import { mailFailureCodeOf } from '@/integrations/mail/utils/mail-failure-code';
import { INVITABLE_ROLES } from '@/modules/auth/constants/mail.constants';
import { buildInvitationMail } from '@/modules/auth/mail/invitation.mail';
import { PasswordLinksService } from '@/modules/auth/services/password-links.service';
import { buildSetPasswordUrl } from '@/modules/auth/utils/set-password-url';
import { UsersService } from '@/modules/users/services/users.service';
import {
  ADMIN_STAFF_LOG_MESSAGES as LOG,
  ADMIN_STAFF_MESSAGES,
} from '../constants/admin-staff.constants';
import { USER_STATUS } from '../constants/admin-users.constants';
import type { InviteStaffDto } from '../dto/admin-staff.dto';
import type {
  InvitedStaffMember,
  IssuedInvite,
  StaffInviteResult,
} from '../types/admin-staff.types';
import { recordUserAction } from '../utils/admin-action-log';
import { lockTargetUser } from '../utils/admin-target-lock';
import { deriveUserStatus } from '../utils/user-status';

@Injectable()
export class AdminStaffInvitesService {
  private readonly logger = new Logger(AdminStaffInvitesService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly users: UsersService,
    private readonly links: PasswordLinksService,
    private readonly mail: MailGateway,
    private readonly config: ConfigService,
  ) {}

  async invite(adminId: number, dto: InviteStaffDto): Promise<StaffInviteResult> {
    const issued = await this.db.transaction(async (tx) => {
      const user = await this.users.create(
        {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          passwordHash: null,
          roleName: dto.role,
        },
        tx,
      );
      const member = {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        role: dto.role,
      };

      return this.issue(tx, adminId, member, ADMIN_ACTION.STAFF_INVITED);
    });

    return this.deliver(issued);
  }

  async resend(adminId: number, userId: number): Promise<StaffInviteResult> {
    const issued = await withLockConflict(
      () =>
        this.db.transaction(async (tx) => {
          const user = await lockTargetUser(tx, userId);
          const role = INVITABLE_ROLES.find((invitable) => invitable === user.roleName);

          if (!role || deriveUserStatus(user) !== USER_STATUS.INVITED) {
            throw new ConflictException(ADMIN_STAFF_MESSAGES.INVITE_ONLY_INVITED);
          }

          const member = { userId, email: user.email, firstName: user.firstName, role };

          return this.issue(tx, adminId, member, ADMIN_ACTION.INVITE_RESENT);
        }),
      ADMIN_STAFF_MESSAGES.USER_BUSY,
      () => this.logger.warn(`${LOG.USER_BUSY}: user ${userId}`),
    );

    return this.deliver(issued);
  }

  private async issue(
    tx: Transaction,
    adminId: number,
    member: InvitedStaffMember,
    action: typeof ADMIN_ACTION.STAFF_INVITED | typeof ADMIN_ACTION.INVITE_RESENT,
  ): Promise<IssuedInvite> {
    const link = await this.links.issue(tx, {
      userId: member.userId,
      kind: TOKEN_KIND.INVITE,
      createdBy: adminId,
    });
    const base = { actorId: adminId, targetUserId: member.userId };

    await recordUserAction(
      tx,
      action === ADMIN_ACTION.STAFF_INVITED
        ? { ...base, action, details: { role: member.role } }
        : { ...base, action, details: {} },
    );

    return { member, link };
  }

  private async deliver({ member, link }: IssuedInvite): Promise<StaffInviteResult> {
    const setPasswordUrl = buildSetPasswordUrl(
      this.config.getOrThrow<string>(ENV_KEYS.APP_URL),
      link.token,
    );
    const emailSent = await this.mail
      .send(
        buildInvitationMail({
          to: member.email,
          firstName: member.firstName,
          roleName: member.role,
          link: setPasswordUrl,
        }),
      )
      .then(
        () => true,
        (error: unknown) => {
          this.logger.error(
            `${LOG.INVITE_MAIL_FAILED}: user ${member.userId}, ${mailFailureCodeOf(error)}`,
          );

          return false;
        },
      );

    return {
      userId: member.userId,
      email: member.email,
      setPasswordUrl,
      expiresAt: link.expiresAt,
      emailSent,
    };
  }
}
