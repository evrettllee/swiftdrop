import { Controller, Get, Query } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { MANAGER_COURIERS_ROUTES } from '../constants/manager-couriers-map.constants';
import { type CouriersMapDto, couriersMapSchema } from '../dto/manager-couriers-map.dto';
import { ManagerCouriersMapService } from '../services/manager-couriers-map.service';
import type { CouriersMap } from '../types/manager-couriers-map.types';

@Controller(MANAGER_COURIERS_ROUTES.BASE)
@Roles(ROLE.MANAGER, ROLE.ADMIN)
export class ManagerCouriersController {
  constructor(private readonly map: ManagerCouriersMapService) {}

  @Get(MANAGER_COURIERS_ROUTES.MAP)
  findMap(
    @Query(new ZodValidationPipe(couriersMapSchema)) query: CouriersMapDto,
  ): Promise<CouriersMap> {
    return this.map.find(query);
  }
}
