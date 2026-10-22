import { Module } from '@nestjs/common';
import { CouriersModule } from '../couriers/couriers.module';
import { OrderEventsService } from './services/order-events.service';
import { OrderTransactionsService } from './services/order-transactions.service';

// Live events of orders. It depends on the socket gateway only, so every module that changes an
// order can import it without a cycle.
@Module({
  imports: [CouriersModule],
  providers: [OrderEventsService, OrderTransactionsService],
  exports: [OrderTransactionsService],
})
export class TrackingModule {}
