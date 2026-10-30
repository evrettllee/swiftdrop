import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { type OrderIdParamDto, orderIdParamSchema } from '@/modules/orders/dto/order-id-param.dto';
import { MANAGER_ASSIGNMENT_ROUTES } from '../constants/manager-assignment.constants';
import { MANAGER_ORDERS_ROUTES } from '../constants/manager-orders.constants';
import {
  type AssignCourierDto,
  assignCourierSchema,
  type CourierCandidatesDto,
  courierCandidatesSchema,
} from '../dto/manager-assignment.dto';
import { ManagerCourierCandidatesService } from '../services/manager-courier-candidates.service';
import { ManagerOrderAssignmentService } from '../services/manager-order-assignment.service';
import type { AssignedOrder, CourierCandidates } from '../types/manager-assignment.types';

@Controller(MANAGER_ORDERS_ROUTES.BASE)
@Roles(ROLE.MANAGER, ROLE.ADMIN)
export class ManagerOrderAssignmentController {
  constructor(
    private readonly candidates: ManagerCourierCandidatesService,
    private readonly assignment: ManagerOrderAssignmentService,
  ) {}

  @Get(MANAGER_ASSIGNMENT_ROUTES.CANDIDATES)
  findCandidates(
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
    @Query(new ZodValidationPipe(courierCandidatesSchema)) query: CourierCandidatesDto,
  ): Promise<CourierCandidates> {
    return this.candidates.find(params.orderId, query);
  }

  @Post(MANAGER_ASSIGNMENT_ROUTES.ASSIGN)
  @HttpCode(HttpStatus.OK)
  assign(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
    @Body(new ZodValidationPipe(assignCourierSchema)) body: AssignCourierDto,
  ): Promise<AssignedOrder> {
    return this.assignment.assign(user.userId, params.orderId, body.courierId);
  }
}
