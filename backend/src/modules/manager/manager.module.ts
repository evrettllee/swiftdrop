import { Module } from '@nestjs/common';
import { ManagerOrdersController } from './controllers/manager-orders.controller';
import { ManagerOrderCountsService } from './services/manager-order-counts.service';
import { ManagerOrdersService } from './services/manager-orders.service';

@Module({
  controllers: [ManagerOrdersController],
  providers: [ManagerOrdersService, ManagerOrderCountsService],
})
export class ManagerModule {}
