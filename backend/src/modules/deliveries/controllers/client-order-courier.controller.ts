import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ROLE } from '../../../common/enums/role.enum';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth.types';
import { type OrderIdParamDto, orderIdParamSchema } from '../../orders/dto/order-id-param.dto';
import { ROUTING_THROTTLE } from '../../routing/constants/routing.constants';
import { CLIENT_ORDER_COURIER_ROUTES } from '../constants/deliveries.constants';
import { ClientOrderCourierService } from '../services/client-order-courier.service';
import { ClientOrderRouteService } from '../services/client-order-route.service';
import type { ClientOrderCourier, ClientOrderRoute } from '../types/deliveries.types';

@Controller(CLIENT_ORDER_COURIER_ROUTES.BASE)
@Roles(ROLE.CLIENT)
export class ClientOrderCourierController {
  constructor(
    private readonly orderCourier: ClientOrderCourierService,
    private readonly orderRoute: ClientOrderRouteService,
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
  @Throttle(ROUTING_THROTTLE)
  route(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<ClientOrderRoute> {
    return this.orderRoute.find(user.userId, params.orderId);
  }
}
