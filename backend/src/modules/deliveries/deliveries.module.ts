import { Module } from '@nestjs/common';
import { CouriersModule } from '../couriers/couriers.module';
import { ClientOrderCourierController } from './controllers/client-order-courier.controller';
import { CourierOrdersController } from './controllers/courier-orders.controller';
import { CourierStatsController } from './controllers/courier-stats.controller';
import { ClientOrderCourierService } from './services/client-order-courier.service';
import { CourierHistoryService } from './services/courier-history.service';
import { CourierOrderViewsService } from './services/courier-order-views.service';
import { CourierStatsService } from './services/courier-stats.service';
import { DeliveryHandoverService } from './services/delivery-handover.service';
import { DeliveryProgressService } from './services/delivery-progress.service';

@Module({
  imports: [CouriersModule],
  controllers: [CourierOrdersController, ClientOrderCourierController, CourierStatsController],
  providers: [
    CourierOrderViewsService,
    DeliveryProgressService,
    DeliveryHandoverService,
    ClientOrderCourierService,
    CourierHistoryService,
    CourierStatsService,
  ],
})
export class DeliveriesModule {}
