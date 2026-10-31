import { Module } from '@nestjs/common';
import { CouriersController } from './controllers/couriers.controller';
import { CourierAvailabilityService } from './services/courier-availability.service';
import { CourierLocationEventsService } from './services/courier-location-events.service';
import { CourierLocationService } from './services/courier-location.service';
import { CourierProfilesService } from './services/courier-profiles.service';
import { CourierShiftEventsService } from './services/courier-shift-events.service';
import { CourierVehiclesService } from './services/courier-vehicles.service';

@Module({
  controllers: [CouriersController],
  providers: [
    CourierProfilesService,
    CourierVehiclesService,
    CourierAvailabilityService,
    CourierLocationService,
    CourierLocationEventsService,
    CourierShiftEventsService,
  ],
  exports: [
    CourierProfilesService,
    CourierLocationService,
    CourierLocationEventsService,
    CourierShiftEventsService,
  ],
})
export class CouriersModule {}
