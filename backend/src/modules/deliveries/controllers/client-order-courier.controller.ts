import { Controller, Get, Param } from '@nestjs/common';
import { ROLE } from '@/common/enums/role.enum';
import { UserThrottle } from '@/common/guards/user-throttle.guard';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { type OrderIdParamDto, orderIdParamSchema } from '@/modules/orders/dto/order-id-param.dto';
import { ROUTING_THROTTLE } from '@/modules/routing/constants/routing.constants';
import { CLIENT_ORDER_COURIER_ROUTES } from '../constants/deliveries.constants';
import { ClientOrderCourierService } from '../services/client-order-courier.service';
import { OrderRouteService } from '../services/order-route.service';
import type { ClientOrderCourier, ClientOrderRoute } from '../types/deliveries.types';

@Controller(CLIENT_ORDER_COURIER_ROUTES.BASE)
@Roles(ROLE.CLIENT)
export class ClientOrderCourierController {
  constructor(
    private readonly orderCourier: ClientOrderCourierService,
    private readonly orderRoute: OrderRouteService,
  ) {}

  @Get(CLIENT_ORDER_COURIER_ROUTES.COURIER)
  find(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<ClientOrderCourier> {
    return this.orderCourier.find(user.userId, params.orderId);
  }

  // The trip of the parcel and, while the order is with the courier, their way to the next point and
  // their last known position.
  @Get(CLIENT_ORDER_COURIER_ROUTES.ROUTE)
  @UserThrottle(ROUTING_THROTTLE)
  route(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<ClientOrderRoute> {
    return this.orderRoute.findForClient(user.userId, params.orderId);
  }
}
