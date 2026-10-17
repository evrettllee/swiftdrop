import { Module } from '@nestjs/common';
import { CouriersModule } from '../couriers/couriers.module';
import { RoutingModule } from '../routing/routing.module';
import { ClientOrderCourierController } from './controllers/client-order-courier.controller';
import { CourierOrdersController } from './controllers/courier-orders.controller';
import { CourierStatsController } from './controllers/courier-stats.controller';
import { ClientOrderCourierService } from './services/client-order-courier.service';
import { ClientOrderRouteService } from './services/client-order-route.service';
import { CourierHistoryOrderService } from './services/courier-history-order.service';
import { CourierHistoryService } from './services/courier-history.service';
import { CourierOrderViewsService } from './services/courier-order-views.service';
import { CourierStatsService } from './services/courier-stats.service';
import { DeliveryHandoverService } from './services/delivery-handover.service';
import { DeliveryProgressService } from './services/delivery-progress.service';

@Module({
  imports: [CouriersModule, RoutingModule],
  controllers: [CourierOrdersController, ClientOrderCourierController, CourierStatsController],
  providers: [
    CourierOrderViewsService,
    DeliveryProgressService,
    DeliveryHandoverService,
    ClientOrderCourierService,
    ClientOrderRouteService,
    CourierHistoryService,
    CourierHistoryOrderService,
    CourierStatsService,
  ],
})
export class DeliveriesModule {}
