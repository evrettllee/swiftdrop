import { Module } from '@nestjs/common';
import { DeliveriesModule } from '@/modules/deliveries/deliveries.module';
import { ManagerOrdersController } from './controllers/manager-orders.controller';
import { ManagerOrderCountsService } from './services/manager-order-counts.service';
import { ManagerOrderDetailsService } from './services/manager-order-details.service';
import { ManagerOrdersService } from './services/manager-orders.service';

@Module({
  imports: [DeliveriesModule],
  controllers: [ManagerOrdersController],
  providers: [ManagerOrdersService, ManagerOrderCountsService, ManagerOrderDetailsService],
})
export class ManagerModule {}
