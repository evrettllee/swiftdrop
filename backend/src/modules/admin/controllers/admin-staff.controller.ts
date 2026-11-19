import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { UserThrottle } from '@/common/guards/user-throttle.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import {
  ADMIN_STAFF_ROUTES,
  STAFF_INVITE_THROTTLE,
  STAFF_RESEND_THROTTLE,
} from '../constants/admin-staff.constants';
import { ADMIN_ROUTES } from '../constants/admin-users.constants';
import {
  type ChangeRoleDto,
  changeRoleSchema,
  type InviteStaffDto,
  inviteStaffSchema,
  type UpdateStaffDto,
  updateStaffSchema,
} from '../dto/admin-staff.dto';
import { type UserIdParamDto, userIdParamSchema } from '../dto/admin-users.dto';
import { AdminStaffInvitesService } from '../services/admin-staff-invites.service';
import { AdminStaffRolesService } from '../services/admin-staff-roles.service';
import { AdminStaffUpdatesService } from '../services/admin-staff-updates.service';
import type { StaffInviteResult } from '../types/admin-staff.types';
import type { AdminUserCard } from '../types/admin-users.types';

@Controller(ADMIN_ROUTES.BASE)
@Roles(ROLE.ADMIN)
export class AdminStaffController {
  constructor(
    private readonly invites: AdminStaffInvitesService,
    private readonly updates: AdminStaffUpdatesService,
    private readonly roles: AdminStaffRolesService,
  ) {}

  @Post(ADMIN_STAFF_ROUTES.STAFF)
  @UserThrottle(STAFF_INVITE_THROTTLE)
  invite(
    @CurrentUser() admin: AuthUser,
    @Body(new ZodValidationPipe(inviteStaffSchema)) dto: InviteStaffDto,
  ): Promise<StaffInviteResult> {
    return this.invites.invite(admin.userId, dto);
  }

  @Post(ADMIN_STAFF_ROUTES.USER_INVITE)
  @UserThrottle(STAFF_RESEND_THROTTLE)
  resend(
    @CurrentUser() admin: AuthUser,
    @Param(new ZodValidationPipe(userIdParamSchema)) params: UserIdParamDto,
  ): Promise<StaffInviteResult> {
    return this.invites.resend(admin.userId, params.userId);
  }

  @Post(ADMIN_STAFF_ROUTES.USER_ROLE)
  @HttpCode(HttpStatus.OK)
  changeRole(
    @CurrentUser() admin: AuthUser,
    @Param(new ZodValidationPipe(userIdParamSchema)) params: UserIdParamDto,
    @Body(new ZodValidationPipe(changeRoleSchema)) dto: ChangeRoleDto,
  ): Promise<AdminUserCard> {
    return this.roles.change(admin.userId, params.userId, dto.role);
  }

  @Patch(ADMIN_ROUTES.USER)
  update(
    @CurrentUser() admin: AuthUser,
    @Param(new ZodValidationPipe(userIdParamSchema)) params: UserIdParamDto,
    @Body(new ZodValidationPipe(updateStaffSchema)) dto: UpdateStaffDto,
  ): Promise<AdminUserCard> {
    return this.updates.update(admin.userId, params.userId, dto);
  }
}
