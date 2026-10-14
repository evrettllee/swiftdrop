import { Module } from '@nestjs/common';
import { CouriersModule } from '../couriers/couriers.module';
import { ClientOrderCourierController } from './controllers/client-order-courier.controller';
import { CourierOrdersController } from './controllers/courier-orders.controller';
import { ClientOrderCourierService } from './services/client-order-courier.service';
import { CourierOrderViewsService } from './services/courier-order-views.service';
import { DeliveryHandoverService } from './services/delivery-handover.service';
import { DeliveryProgressService } from './services/delivery-progress.service';

@Module({
  imports: [CouriersModule],
  controllers: [CourierOrdersController, ClientOrderCourierController],
  providers: [
    CourierOrderViewsService,
    DeliveryProgressService,
    DeliveryHandoverService,
    ClientOrderCourierService,
  ],
})
export class DeliveriesModule {}
