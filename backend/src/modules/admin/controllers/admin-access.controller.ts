import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { UserThrottle } from '@/common/guards/user-throttle.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { ADMIN_ACCESS_ROUTES, PASSWORD_RESET_THROTTLE } from '../constants/admin-access.constants';
import { ADMIN_ROUTES } from '../constants/admin-users.constants';
import { type BlockUserDto, blockUserSchema } from '../dto/admin-access.dto';
import { type UserIdParamDto, userIdParamSchema } from '../dto/admin-users.dto';
import { AdminPasswordResetService } from '../services/admin-password-reset.service';
import { AdminUserAccessService } from '../services/admin-user-access.service';
import { AdminUserDeleteService } from '../services/admin-user-delete.service';
import type { StaffInviteResult } from '../types/admin-staff.types';
import type { AdminUserCard } from '../types/admin-users.types';

@Controller(ADMIN_ROUTES.BASE)
@Roles(ROLE.ADMIN)
export class AdminAccessController {
  constructor(
    private readonly access: AdminUserAccessService,
    private readonly resets: AdminPasswordResetService,
    private readonly deletes: AdminUserDeleteService,
  ) {}

  @Post(ADMIN_ACCESS_ROUTES.BLOCK)
  @HttpCode(HttpStatus.OK)
  block(
    @CurrentUser() admin: AuthUser,
    @Param(new ZodValidationPipe(userIdParamSchema)) params: UserIdParamDto,
    @Body(new ZodValidationPipe(blockUserSchema)) dto: BlockUserDto,
  ): Promise<AdminUserCard> {
    return this.access.block(admin.userId, params.userId, dto.reason);
  }

  @Post(ADMIN_ACCESS_ROUTES.UNBLOCK)
  @HttpCode(HttpStatus.OK)
  unblock(
    @CurrentUser() admin: AuthUser,
    @Param(new ZodValidationPipe(userIdParamSchema)) params: UserIdParamDto,
  ): Promise<AdminUserCard> {
    return this.access.unblock(admin.userId, params.userId);
  }

  @Post(ADMIN_ACCESS_ROUTES.SESSIONS_REVOKE)
  @HttpCode(HttpStatus.OK)
  revokeSessions(
    @CurrentUser() admin: AuthUser,
    @Param(new ZodValidationPipe(userIdParamSchema)) params: UserIdParamDto,
  ): Promise<AdminUserCard> {
    return this.access.endSessions(admin.userId, params.userId);
  }

  @Delete(ADMIN_ROUTES.USER)
  remove(
    @CurrentUser() admin: AuthUser,
    @Param(new ZodValidationPipe(userIdParamSchema)) params: UserIdParamDto,
  ): Promise<AdminUserCard> {
    return this.deletes.delete(admin.userId, params.userId);
  }

  @Post(ADMIN_ACCESS_ROUTES.PASSWORD_RESET)
  @HttpCode(HttpStatus.OK)
  @UserThrottle(PASSWORD_RESET_THROTTLE)
  resetPassword(
    @CurrentUser() admin: AuthUser,
    @Param(new ZodValidationPipe(userIdParamSchema)) params: UserIdParamDto,
  ): Promise<StaffInviteResult> {
    return this.resets.reset(admin.userId, params.userId);
  }
}
