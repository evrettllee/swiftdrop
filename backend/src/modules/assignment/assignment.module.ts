import { Module } from '@nestjs/common';
import { OsrmModule } from '../../integrations/osrm/osrm.module';
import { CouriersModule } from '../couriers/couriers.module';
import { CourierOffersController } from './controllers/courier-offers.controller';
import { CourierCandidatesService } from './services/courier-candidates.service';
import { DispatchOrdersService } from './services/dispatch-orders.service';
import { OfferNotifierService } from './services/offer-notifier.service';
import { OfferRoutesService } from './services/offer-routes.service';
import { OfferViewsService } from './services/offer-views.service';
import { OrderOffersService } from './services/order-offers.service';

@Module({
  imports: [OsrmModule, CouriersModule],
  controllers: [CourierOffersController],
  providers: [
    DispatchOrdersService,
    CourierCandidatesService,
    OfferRoutesService,
    OrderOffersService,
    OfferViewsService,
    OfferNotifierService,
  ],
})
export class AssignmentModule {}
