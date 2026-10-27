import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CouriersModule } from '@/modules/couriers/couriers.module';
import { UsersModule } from '@/modules/users/users.module';
import { AppGateway } from './gateways/app.gateway';
import { OrderRoomsService } from './services/order-rooms.service';
import { RealtimeEventsService } from './services/realtime-events.service';
import { SocketAdmissionService } from './services/socket-admission.service';
import { SocketAuthService } from './services/socket-auth.service';
import { SocketSessionTimersService } from './services/socket-session-timers.service';

// The secret is passed on every check, so the JWT module needs no options of its own here.
@Module({
  imports: [JwtModule.register({}), UsersModule, CouriersModule],
  providers: [
    SocketAuthService,
    SocketSessionTimersService,
    SocketAdmissionService,
    OrderRoomsService,
    RealtimeEventsService,
    AppGateway,
  ],
  exports: [RealtimeEventsService],
})
export class RealtimeModule {}
