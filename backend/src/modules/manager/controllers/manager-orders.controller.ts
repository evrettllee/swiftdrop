import { Controller, Get, Query } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { MANAGER_ORDERS_ROUTES } from '../constants/manager-orders.constants';
import {
  type ManagerOrderCountsDto,
  managerOrderCountsSchema,
  type ManagerOrdersDto,
  managerOrdersSchema,
} from '../dto/manager-orders.dto';
import { ManagerOrderCountsService } from '../services/manager-order-counts.service';
import { ManagerOrdersService } from '../services/manager-orders.service';
import type { ManagerOrderCounts, ManagerOrdersPage } from '../types/manager-orders.types';

@Controller(MANAGER_ORDERS_ROUTES.BASE)
@Roles(ROLE.MANAGER, ROLE.ADMIN)
export class ManagerOrdersController {
  constructor(
    private readonly ordersList: ManagerOrdersService,
    private readonly counts: ManagerOrderCountsService,
  ) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(managerOrdersSchema)) query: ManagerOrdersDto,
  ): Promise<ManagerOrdersPage> {
    return this.ordersList.list(query);
  }

  @Get(MANAGER_ORDERS_ROUTES.COUNTS)
  countByGroup(
    @Query(new ZodValidationPipe(managerOrderCountsSchema)) query: ManagerOrderCountsDto,
  ): Promise<ManagerOrderCounts> {
    return this.counts.count(query);
  }
}
