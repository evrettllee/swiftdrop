import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '@/modules/users/users.module';
import { SocketAuthService } from './services/socket-auth.service';
import { SocketSessionTimersService } from './services/socket-session-timers.service';

// The secret is passed on every check, so the JWT module needs no options of its own here.
@Module({
  imports: [JwtModule.register({}), UsersModule],
  providers: [SocketAuthService, SocketSessionTimersService],
  exports: [SocketAuthService, SocketSessionTimersService],
})
export class RealtimeModule {}
