import { Module } from '@nestjs/common';
import { CouriersModule } from '../couriers/couriers.module';
import { CourierOrdersController } from './controllers/courier-orders.controller';
import { CourierOrderViewsService } from './services/courier-order-views.service';
import { DeliveryHandoverService } from './services/delivery-handover.service';
import { DeliveryProgressService } from './services/delivery-progress.service';

@Module({
  imports: [CouriersModule],
  controllers: [CourierOrdersController],
  providers: [CourierOrderViewsService, DeliveryProgressService, DeliveryHandoverService],
})
export class DeliveriesModule {}
