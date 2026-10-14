import { Module } from '@nestjs/common';
import { CouriersController } from './controllers/couriers.controller';
import { CourierAvailabilityService } from './services/courier-availability.service';
import { CourierProfilesService } from './services/courier-profiles.service';
import { CourierVehiclesService } from './services/courier-vehicles.service';

@Module({
  controllers: [CouriersController],
  providers: [CourierProfilesService, CourierVehiclesService, CourierAvailabilityService],
  exports: [CourierProfilesService],
})
export class CouriersModule {}
