import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PricingModule } from '../pricing/pricing.module';
import { OrderCancellationService } from './services/order-cancellation.service';
import { OrderDetailsService } from './services/order-details.service';
import { OrderPlacementService } from './services/order-placement.service';
import { OrdersController } from './orders.controller';
import { OrdersQueryService } from './services/orders-query.service';
import { UnpaidOrdersService } from './services/unpaid-orders.service';

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
