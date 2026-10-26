import { Module } from '@nestjs/common';
import { RealtimeModule } from '@/modules/realtime/realtime.module';
import { CouriersController } from './controllers/couriers.controller';
import { CouriersGateway } from './gateways/couriers.gateway';
import { CourierAvailabilityService } from './services/courier-availability.service';
import { CourierLocationEventsService } from './services/courier-location-events.service';
import { CourierLocationService } from './services/courier-location.service';
import { CourierProfilesService } from './services/courier-profiles.service';
import { CourierVehiclesService } from './services/courier-vehicles.service';
import { OrderRoomsService } from './services/order-rooms.service';
import { SocketAdmissionService } from './services/socket-admission.service';

@Module({
  imports: [RealtimeModule],
  controllers: [CouriersController],
  providers: [
    CourierProfilesService,
    CourierVehiclesService,
    CourierAvailabilityService,
    CourierLocationService,
    CourierLocationEventsService,
    OrderRoomsService,
    SocketAdmissionService,
    CouriersGateway,
  ],
  exports: [CourierProfilesService, CourierLocationEventsService, CouriersGateway],
})
export class CouriersModule {}
