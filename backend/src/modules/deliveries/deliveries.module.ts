import { Module } from '@nestjs/common';
import { CouriersModule } from '../couriers/couriers.module';
import { CourierOrdersController } from './controllers/courier-orders.controller';
import { CourierOrderViewsService } from './services/courier-order-views.service';
import { DeliveryProgressService } from './services/delivery-progress.service';

@Module({
  imports: [CouriersModule],
  controllers: [CourierOrdersController],
  providers: [CourierOrderViewsService, DeliveryProgressService],
})
export class DeliveriesModule {}
