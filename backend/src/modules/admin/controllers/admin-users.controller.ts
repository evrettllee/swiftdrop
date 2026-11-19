import { Controller, Get, Param, Query } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { ADMIN_ROUTES } from '../constants/admin-users.constants';
import {
  type AdminUserCountsDto,
  adminUserCountsSchema,
  type AdminUsersDto,
  adminUsersSchema,
  type UserIdParamDto,
  userIdParamSchema,
} from '../dto/admin-users.dto';
import { AdminUserCardService } from '../services/admin-user-card.service';
import { AdminUsersService } from '../services/admin-users.service';
import type { AdminUserCard, AdminUserCounts, AdminUsersPage } from '../types/admin-users.types';

@Controller(ADMIN_ROUTES.BASE)
@Roles(ROLE.ADMIN)
export class AdminUsersController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly cards: AdminUserCardService,
  ) {}

  @Get(ADMIN_ROUTES.USERS)
  list(
    @Query(new ZodValidationPipe(adminUsersSchema)) query: AdminUsersDto,
  ): Promise<AdminUsersPage> {
    return this.users.list(query);
  }

  @Get(ADMIN_ROUTES.USERS_COUNTS)
  counts(
    @Query(new ZodValidationPipe(adminUserCountsSchema)) query: AdminUserCountsDto,
  ): Promise<AdminUserCounts> {
    return this.users.counts(query);
  }

  @Get(ADMIN_ROUTES.USER)
  get(
    @Param(new ZodValidationPipe(userIdParamSchema)) params: UserIdParamDto,
  ): Promise<AdminUserCard> {
    return this.cards.get(params.userId);
  }
}
