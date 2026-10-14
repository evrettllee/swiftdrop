import { Module } from '@nestjs/common';
import { OsrmModule } from '../../integrations/osrm/osrm.module';
import { CourierCandidatesService } from './services/courier-candidates.service';
import { DispatchOrdersService } from './services/dispatch-orders.service';
import { OfferRoutesService } from './services/offer-routes.service';
import { OrderOffersService } from './services/order-offers.service';

@Module({
  imports: [OsrmModule],
  providers: [
    DispatchOrdersService,
    CourierCandidatesService,
    OfferRoutesService,
    OrderOffersService,
  ],
})
export class AssignmentModule {}
