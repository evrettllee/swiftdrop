import { Module } from '@nestjs/common';
import { PricingModule } from '../pricing/pricing.module';
import { OrderCancellationService } from './order-cancellation.service';
import { OrderDetailsService } from './order-details.service';
import { OrderPlacementService } from './order-placement.service';
import { OrdersController } from './orders.controller';
import { OrdersQueryService } from './orders-query.service';

@Module({
  imports: [PricingModule],
  controllers: [OrdersController],
  providers: [
    OrderPlacementService,
    OrdersQueryService,
    OrderDetailsService,
    OrderCancellationService,
  ],
})
export class OrdersModule {}
