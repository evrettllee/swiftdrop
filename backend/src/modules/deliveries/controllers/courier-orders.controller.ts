import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { CourierProfilesService } from '@/modules/couriers/services/courier-profiles.service';
import { type OrderIdParamDto, orderIdParamSchema } from '@/modules/orders/dto/order-id-param.dto';
import { ROUTING_THROTTLE } from '@/modules/routing/constants/routing.constants';
import { RouteLinesService } from '@/modules/routing/services/route-lines.service';
import type { RouteLines } from '@/modules/routing/types/routing.types';
import {
  COURIER_ORDERS_ROUTES,
  DELIVERIES_ERROR_MESSAGES,
} from '../constants/deliveries.constants';
import { type CourierHistoryDto, courierHistorySchema } from '../dto/courier-history.dto';
import { type DeliverOrderDto, deliverOrderSchema } from '../dto/deliver-order.dto';
import { CourierHistoryOrderService } from '../services/courier-history-order.service';
import { CourierHistoryService } from '../services/courier-history.service';
import { CourierOrderViewsService } from '../services/courier-order-views.service';
import { DeliveryHandoverService } from '../services/delivery-handover.service';
import { DeliveryProgressService } from '../services/delivery-progress.service';
import type {
  CourierHistoryOrder,
  CourierHistoryPage,
  CourierIdentity,
  CourierOrder,
  CurrentCourierOrder,
} from '../types/deliveries.types';

@Controller(COURIER_ORDERS_ROUTES.BASE)
@Roles(ROLE.COURIER)
export class CourierOrdersController {
  constructor(
    private readonly profiles: CourierProfilesService,
    private readonly views: CourierOrderViewsService,
    private readonly progress: DeliveryProgressService,
    private readonly handover: DeliveryHandoverService,
    private readonly history: CourierHistoryService,
    private readonly historyOrders: CourierHistoryOrderService,
    private readonly routes: RouteLinesService,
  ) {}

  @Get(COURIER_ORDERS_ROUTES.CURRENT)
  async current(@CurrentUser() user: AuthUser): Promise<CurrentCourierOrder> {
    const courierProfileId = await this.profiles.getProfileId(user.userId);

    return { order: await this.views.findActive(courierProfileId) };
  }

  // Before the pickup: to the pickup point and on to the recipient; after it: to the recipient.
  @Get(COURIER_ORDERS_ROUTES.CURRENT_ROUTE)
  @Throttle(ROUTING_THROTTLE)
  async currentRoute(@CurrentUser() user: AuthUser): Promise<RouteLines> {
    const courierProfileId = await this.profiles.getProfileId(user.userId);
    const order = await this.views.findActive(courierProfileId);

    if (order === null) {
      throw new NotFoundException(DELIVERIES_ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return this.routes.forCourierOrder(courierProfileId, order);
  }

  @Get(COURIER_ORDERS_ROUTES.HISTORY)
  async list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(courierHistorySchema)) query: CourierHistoryDto,
  ): Promise<CourierHistoryPage> {
    return this.history.list(await this.profiles.getProfileId(user.userId), query);
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

  @Post(COURIER_ORDERS_ROUTES.DELIVER)
  @HttpCode(HttpStatus.OK)
  async deliver(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
    @Body(new ZodValidationPipe(deliverOrderSchema)) dto: DeliverOrderDto,
  ): Promise<CourierOrder> {
    return this.handover.deliver(await this.identify(user), params.orderId, dto.code);
  }

  // After CURRENT, CURRENT_ROUTE and HISTORY: `:orderId` would catch them otherwise.
  @Get(COURIER_ORDERS_ROUTES.ORDER)
  async findFinished(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<CourierHistoryOrder> {
    return this.historyOrders.findOne(
      await this.profiles.getProfileId(user.userId),
      params.orderId,
    );
  }

  // The trip of the parcel of a finished order, by the vehicle of the courier.
  @Get(COURIER_ORDERS_ROUTES.ORDER_ROUTE)
  @Throttle(ROUTING_THROTTLE)
  async finishedRoute(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<RouteLines> {
    const courierProfileId = await this.profiles.getProfileId(user.userId);
    const order = await this.historyOrders.findRow(courierProfileId, params.orderId);

    return this.routes.forHistoryOrder(courierProfileId, order);
  }

  private async identify(user: AuthUser): Promise<CourierIdentity> {
    return {
      userId: user.userId,
      courierProfileId: await this.profiles.getProfileId(user.userId),
    };
  }
}
