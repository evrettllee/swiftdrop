import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import type { AuthUser } from '@/modules/auth/types/auth.types';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { ROLE } from '@/common/enums/role.enum';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { type CreateOrderDto, createOrderSchema } from '../dto/create-order.dto';
import { type ListOrdersDto, listOrdersSchema } from '../dto/list-orders.dto';
import { type OrderIdParamDto, orderIdParamSchema } from '../dto/order-id-param.dto';
import { OrderCancellationService } from '../services/order-cancellation.service';
import { OrderDetailsService } from '../services/order-details.service';
import { OrderPlacementService } from '../services/order-placement.service';
import { OrdersQueryService } from '../services/orders-query.service';
import { ORDERS_ROUTES } from '../constants/orders.constants';
import type { CancelledOrder, CreatedOrder, OrderDetails, OrdersPage } from '../types/orders.types';

@Controller(ORDERS_ROUTES.BASE)
@Roles(ROLE.CLIENT)
export class OrdersController {
  constructor(
    private readonly placement: OrderPlacementService,
    private readonly query: OrdersQueryService,
    private readonly orderDetails: OrderDetailsService,
    private readonly cancellation: OrderCancellationService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createOrderSchema)) dto: CreateOrderDto,
  ): Promise<CreatedOrder> {
    return this.placement.place(user.userId, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listOrdersSchema)) params: ListOrdersDto,
  ): Promise<OrdersPage> {
    return this.query.list(user.userId, params);
  }

  @Get(ORDERS_ROUTES.BY_ID)
  getDetails(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<OrderDetails> {
    return this.orderDetails.findOne(user.userId, params.orderId);
  }

  @Post(ORDERS_ROUTES.CANCEL)
  @HttpCode(HttpStatus.OK)
  cancel(
    @CurrentUser() user: AuthUser,
    @Param(new ZodValidationPipe(orderIdParamSchema)) params: OrderIdParamDto,
  ): Promise<CancelledOrder> {
    return this.cancellation.cancel(user.userId, params.orderId);
  }
}
