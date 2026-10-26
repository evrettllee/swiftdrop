import { Module } from '@nestjs/common';
import { CouriersModule } from '../couriers/couriers.module';
import { PaymentsModule } from '../payments/payments.module';
import { PricingModule } from '../pricing/pricing.module';
import { OrderCancellationService } from './services/order-cancellation.service';
import { OrderDetailsService } from './services/order-details.service';
import { OrderPlacementService } from './services/order-placement.service';
import { OrdersController } from './controllers/orders.controller';
import { OrdersQueryService } from './services/orders-query.service';
import { UnpaidOrdersJob } from './jobs/unpaid-orders.job';
import { UnpaidOrdersService } from './services/unpaid-orders.service';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [PricingModule, PaymentsModule, CouriersModule, TrackingModule],
  controllers: [OrdersController],
  providers: [
    OrderPlacementService,
    OrdersQueryService,
    OrderDetailsService,
    OrderCancellationService,
    UnpaidOrdersService,
    UnpaidOrdersJob,
  ],
})
export class OrdersModule {}
