import { Module } from '@nestjs/common';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { PricingModule } from '@/modules/pricing/pricing.module';
import { RealtimeModule } from '@/modules/realtime/realtime.module';
import { CancelOrderService } from './services/cancel-order.service';
import { OrderCancellationService } from './services/order-cancellation.service';
import { OrderDetailsService } from './services/order-details.service';
import { OrderPlacementService } from './services/order-placement.service';
import { OrdersController } from './controllers/orders.controller';
import { OrdersQueryService } from './services/orders-query.service';
import { UnpaidOrdersJob } from './jobs/unpaid-orders.job';
import { UnpaidOrdersService } from './services/unpaid-orders.service';
import { TrackingModule } from '@/modules/tracking/tracking.module';

@Module({
  imports: [PricingModule, PaymentsModule, RealtimeModule, TrackingModule],
  controllers: [OrdersController],
  providers: [
    OrderPlacementService,
    OrdersQueryService,
    OrderDetailsService,
    CancelOrderService,
    OrderCancellationService,
    UnpaidOrdersService,
    UnpaidOrdersJob,
  ],
  exports: [CancelOrderService],
})
export class OrdersModule {}
