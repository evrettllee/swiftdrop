import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { CouriersController } from './controllers/couriers.controller';
import { CouriersGateway } from './gateways/couriers.gateway';
import { CourierAvailabilityService } from './services/courier-availability.service';
import { CourierLocationService } from './services/courier-location.service';
import { CourierProfilesService } from './services/courier-profiles.service';
import { CourierVehiclesService } from './services/courier-vehicles.service';

@Module({
  imports: [RealtimeModule],
  controllers: [CouriersController],
  providers: [
    CourierProfilesService,
    CourierVehiclesService,
    CourierAvailabilityService,
    CourierLocationService,
    CouriersGateway,
  ],
  exports: [CourierProfilesService, CouriersGateway],
})
export class CouriersModule {}
