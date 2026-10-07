import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PricingModule } from '../pricing/pricing.module';
import { OrderCancellationService } from './order-cancellation.service';
import { OrderDetailsService } from './order-details.service';
import { OrderPlacementService } from './order-placement.service';
import { OrdersController } from './orders.controller';
import { OrdersQueryService } from './orders-query.service';
import { UnpaidOrdersService } from './unpaid-orders.service';

@Module({
  imports: [PricingModule, PaymentsModule],
  controllers: [OrdersController],
  providers: [
    OrderPlacementService,
    OrdersQueryService,
    OrderDetailsService,
    OrderCancellationService,
    UnpaidOrdersService,
  ],
})
export class OrdersModule {}
