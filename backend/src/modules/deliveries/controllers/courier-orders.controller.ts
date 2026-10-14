import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ROLE } from '../../../common/enums/role.enum';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { AuthUser } from '../../auth/types/auth.types';
import { CourierProfilesService } from '../../couriers/services/courier-profiles.service';
import { type OrderIdParamDto, orderIdParamSchema } from '../../orders/dto/order-id-param.dto';
import { COURIER_ORDERS_ROUTES } from '../constants/deliveries.constants';
import { CourierOrderViewsService } from '../services/courier-order-views.service';
import { DeliveryProgressService } from '../services/delivery-progress.service';
import type { CourierIdentity, CourierOrder, CurrentCourierOrder } from '../types/deliveries.types';

@Controller(COURIER_ORDERS_ROUTES.BASE)
@Roles(ROLE.COURIER)
export class CourierOrdersController {
  constructor(
    private readonly profiles: CourierProfilesService,
    private readonly views: CourierOrderViewsService,
    private readonly progress: DeliveryProgressService,
  ) {}

  @Get(COURIER_ORDERS_ROUTES.CURRENT)
  async current(@CurrentUser() user: AuthUser): Promise<CurrentCourierOrder> {
    const courierProfileId = await this.profiles.getProfileId(user.userId);

    return { order: await this.views.findActive(courierProfileId) };
  }

  @Post(COURIER_ORDERS_ROUTES.PICKUP)
  @HttpCode(HttpStatus.OK)
  async pickUp(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<CourierOrder> {
    return this.progress.pickUp(await this.identify(user), params.orderId);
  }

  @Post(COURIER_ORDERS_ROUTES.DEPART)
  @HttpCode(HttpStatus.OK)
  async depart(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<CourierOrder> {
    return this.progress.depart(await this.identify(user), params.orderId);
  }

  private async identify(user: AuthUser): Promise<CourierIdentity> {
    return {
      userId: user.userId,
      courierProfileId: await this.profiles.getProfileId(user.userId),
    };
  }
}
