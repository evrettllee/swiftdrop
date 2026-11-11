import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { type OrderIdParamDto, orderIdParamSchema } from '@/modules/orders/dto/order-id-param.dto';
import { MANAGER_CANCEL_ROUTE } from '../constants/manager-cancellation.constants';
import { MANAGER_ORDERS_ROUTES } from '../constants/manager-orders.constants';
import { type CancelOrderDto, cancelOrderSchema } from '../dto/manager-cancellation.dto';
import { ManagerOrderCancellationService } from '../services/manager-order-cancellation.service';
import type { StaffCancelledOrder } from '../types/manager-cancellation.types';

@Controller(MANAGER_ORDERS_ROUTES.BASE)
@Roles(ROLE.MANAGER, ROLE.ADMIN)
export class ManagerOrderCancellationController {
  constructor(private readonly cancellation: ManagerOrderCancellationService) {}

  @Post(MANAGER_CANCEL_ROUTE)
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
    @Body(new ZodValidationPipe(cancelOrderSchema)) body: CancelOrderDto,
  ): Promise<StaffCancelledOrder> {
    return this.cancellation.cancel({
      managerUserId: user.userId,
      orderId: params.orderId,
      reason: body.reason,
    });
  }
}
