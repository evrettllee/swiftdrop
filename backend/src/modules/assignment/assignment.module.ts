import { Module } from '@nestjs/common';
import { OsrmModule } from '../../integrations/osrm/osrm.module';
import { CouriersModule } from '../couriers/couriers.module';
import { CourierOffersController } from './controllers/courier-offers.controller';
import { AssignmentJob } from './jobs/assignment.job';
import { AssignmentRoundService } from './services/assignment-round.service';
import { CourierCandidatesService } from './services/courier-candidates.service';
import { DispatchOrdersService } from './services/dispatch-orders.service';
import { OfferNotifierService } from './services/offer-notifier.service';
import { OfferResponsesService } from './services/offer-responses.service';
import { OfferRoutesService } from './services/offer-routes.service';
import { OfferViewsService } from './services/offer-views.service';
import { OrderDispatchService } from './services/order-dispatch.service';
import { OrderOffersService } from './services/order-offers.service';
import { StaleOffersService } from './services/stale-offers.service';

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
    OfferResponsesService,
    StaleOffersService,
    OrderDispatchService,
    AssignmentRoundService,
    AssignmentJob,
  ],
})
export class AssignmentModule {}
