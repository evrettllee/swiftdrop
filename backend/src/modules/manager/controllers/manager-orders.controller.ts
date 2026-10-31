import { Controller, Get, Param, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { ROLE } from '@/common/enums/role.enum';
import { UserThrottle } from '@/common/guards/user-throttle.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { OrderRouteService } from '@/modules/deliveries/services/order-route.service';
import type { ClientOrderRoute } from '@/modules/deliveries/types/deliveries.types';
import { type OrderIdParamDto, orderIdParamSchema } from '@/modules/orders/dto/order-id-param.dto';
import { ROUTING_THROTTLE } from '@/modules/routing/constants/routing.constants';
import {
  MANAGER_EXPORT_ROUTE,
  MANAGER_EXPORT_THROTTLE,
} from '../constants/manager-export.constants';
import { MANAGER_ORDERS_ROUTES } from '../constants/manager-orders.constants';
import type { ManagerOrderDetails } from '../dto/manager-order-details.dto';
import {
  type ManagerOrdersExportDto,
  managerOrdersExportSchema,
} from '../dto/manager-orders-export.dto';
import {
  type ManagerOrderCountsDto,
  managerOrderCountsSchema,
  type ManagerOrdersDto,
  managerOrdersSchema,
} from '../dto/manager-orders.dto';
import { ManagerOrderCountsService } from '../services/manager-order-counts.service';
import { ManagerOrderDetailsService } from '../services/manager-order-details.service';
import { ManagerOrdersExportService } from '../services/manager-orders-export.service';
import { ManagerOrdersService } from '../services/manager-orders.service';
import type { ManagerOrderCounts, ManagerOrdersPage } from '../types/manager-orders.types';
import { exportHeaders } from '../utils/export-headers';

@Controller(MANAGER_ORDERS_ROUTES.BASE)
@Roles(ROLE.MANAGER, ROLE.ADMIN)
export class ManagerOrdersController {
  constructor(
    private readonly ordersList: ManagerOrdersService,
    private readonly counts: ManagerOrderCountsService,
    private readonly details: ManagerOrderDetailsService,
    private readonly orderRoute: OrderRouteService,
    private readonly exports: ManagerOrdersExportService,
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

  @Get(MANAGER_EXPORT_ROUTE)
  @UserThrottle(MANAGER_EXPORT_THROTTLE)
  async export(
    @Query(new ZodValidationPipe(managerOrdersExportSchema)) query: ManagerOrdersExportDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.exports.export(query);

    response.set(exportHeaders(file));

    return new StreamableFile(file.body);
  }

  @Get(MANAGER_ORDERS_ROUTES.DETAILS)
  findOne(
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<ManagerOrderDetails> {
    return this.details.findOne(params.orderId);
  }

  @Get(MANAGER_ORDERS_ROUTES.ROUTE)
  @UserThrottle(ROUTING_THROTTLE)
  route(
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<ClientOrderRoute> {
    return this.orderRoute.findForStaff(params.orderId);
  }
}
