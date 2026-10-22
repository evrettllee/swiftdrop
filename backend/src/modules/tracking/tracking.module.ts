import { Module } from '@nestjs/common';
import { OsrmModule } from '../../integrations/osrm/osrm.module';
import { CouriersModule } from '../couriers/couriers.module';
import { OrderEtaDataService } from './services/order-eta-data.service';
import { OrderEtaStore } from './services/order-eta-store.service';
import { OrderEtaService } from './services/order-eta.service';
import { OrderEventsService } from './services/order-events.service';
import { OrderTransactionsService } from './services/order-transactions.service';

// Live events of orders and their arrival estimates. It depends on the socket gateway and the
// routing service only, so every module that changes an order can import it without a cycle.
@Module({
  imports: [CouriersModule, OsrmModule],
  providers: [
    OrderEventsService,
    OrderEtaStore,
    OrderEtaDataService,
    OrderEtaService,
    OrderTransactionsService,
  ],
  exports: [OrderTransactionsService, OrderEtaService],
})
export class TrackingModule {}
