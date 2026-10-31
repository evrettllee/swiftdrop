import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { MANAGER_ZONES_ROUTES } from '../constants/manager-zones.constants';
import {
  type CreateZoneDto,
  createZoneSchema,
  type UpdateZoneDto,
  updateZoneSchema,
  type ZoneIdParamDto,
  zoneIdParamSchema,
} from '../dto/manager-zones.dto';
import { ManagerZoneWritesService } from '../services/manager-zone-writes.service';
import { ManagerZonesService } from '../services/manager-zones.service';
import type {
  ManagerTariffOption,
  ManagerZone,
  ManagerZoneDetails,
} from '../types/manager-zones.types';

@Controller(MANAGER_ZONES_ROUTES.BASE)
@Roles(ROLE.MANAGER, ROLE.ADMIN)
export class ManagerZonesController {
  constructor(
    private readonly zones: ManagerZonesService,
    private readonly writes: ManagerZoneWritesService,
  ) {}

  @Get(MANAGER_ZONES_ROUTES.ZONES)
  list(): Promise<ManagerZone[]> {
    return this.zones.list();
  }

  @Get(MANAGER_ZONES_ROUTES.TARIFFS)
  tariffs(): Promise<ManagerTariffOption[]> {
    return this.zones.tariffs();
  }

  @Get(MANAGER_ZONES_ROUTES.ZONE)
  get(
    @Param(new ZodValidationPipe(zoneIdParamSchema)) params: ZoneIdParamDto,
  ): Promise<ManagerZoneDetails> {
    return this.zones.get(params.zoneId);
  }

  @Post(MANAGER_ZONES_ROUTES.ZONES)
  create(
    @Body(new ZodValidationPipe(createZoneSchema)) body: CreateZoneDto,
  ): Promise<ManagerZoneDetails> {
    return this.writes.create(body);
  }

  @Patch(MANAGER_ZONES_ROUTES.ZONE)
  update(
    @Param(new ZodValidationPipe(zoneIdParamSchema)) params: ZoneIdParamDto,
    @Body(new ZodValidationPipe(updateZoneSchema)) body: UpdateZoneDto,
  ): Promise<ManagerZoneDetails> {
    return this.writes.update(params.zoneId, body);
  }
}
