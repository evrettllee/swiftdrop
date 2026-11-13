import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { ADMIN_TARIFF_ROUTES } from '../constants/admin-tariffs.constants';
import { ADMIN_ROUTES } from '../constants/admin-users.constants';
import {
  type CreateTariffDto,
  createTariffSchema,
  type TariffIdParamDto,
  tariffIdParamSchema,
  type TariffStatusDto,
  tariffStatusSchema,
  type UpdateTariffDto,
  updateTariffSchema,
} from '../dto/admin-tariffs.dto';
import { AdminTariffWritesService } from '../services/admin-tariff-writes.service';
import { AdminTariffsService } from '../services/admin-tariffs.service';
import type { AdminTariffItem } from '../types/admin-tariffs.types';

@Controller(ADMIN_ROUTES.BASE)
@Roles(ROLE.ADMIN)
export class AdminTariffsController {
  constructor(
    private readonly tariffs: AdminTariffsService,
    private readonly writes: AdminTariffWritesService,
  ) {}

  @Get(ADMIN_TARIFF_ROUTES.TARIFFS)
  list(): Promise<AdminTariffItem[]> {
    return this.tariffs.list();
  }

  @Post(ADMIN_TARIFF_ROUTES.TARIFFS)
  create(
    @CurrentUser() admin: AuthUser,
    @Body(new ZodValidationPipe(createTariffSchema)) dto: CreateTariffDto,
  ): Promise<AdminTariffItem> {
    return this.writes.create(admin.userId, dto);
  }

  @Patch(ADMIN_TARIFF_ROUTES.TARIFF)
  update(
    @CurrentUser() admin: AuthUser,
    @Param(new ZodValidationPipe(tariffIdParamSchema)) params: TariffIdParamDto,
    @Body(new ZodValidationPipe(updateTariffSchema)) dto: UpdateTariffDto,
  ): Promise<AdminTariffItem> {
    return this.writes.update(admin.userId, params.tariffId, dto);
  }

  @Post(ADMIN_TARIFF_ROUTES.TARIFF_STATUS)
  @HttpCode(HttpStatus.OK)
  setStatus(
    @CurrentUser() admin: AuthUser,
    @Param(new ZodValidationPipe(tariffIdParamSchema)) params: TariffIdParamDto,
    @Body(new ZodValidationPipe(tariffStatusSchema)) dto: TariffStatusDto,
  ): Promise<AdminTariffItem> {
    return this.writes.setActive(admin.userId, params.tariffId, dto.isActive);
  }
}
