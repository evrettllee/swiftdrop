import { Controller, Get, Param } from '@nestjs/common';
import { ROLE } from '../../../common/enums/role.enum';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth.types';
import { type OrderIdParamDto, orderIdParamSchema } from '../../orders/dto/order-id-param.dto';
import { CLIENT_ORDER_COURIER_ROUTES } from '../constants/deliveries.constants';
import { ClientOrderCourierService } from '../services/client-order-courier.service';
import type { ClientOrderCourier } from '../types/deliveries.types';

@Controller(CLIENT_ORDER_COURIER_ROUTES.BASE)
@Roles(ROLE.CLIENT)
export class ClientOrderCourierController {
  constructor(private readonly orderCourier: ClientOrderCourierService) {}

  @Get(CLIENT_ORDER_COURIER_ROUTES.COURIER)
  find(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<ClientOrderCourier> {
    return this.orderCourier.find(user.userId, params.orderId);
  }
}
