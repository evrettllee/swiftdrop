import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { SocketAuthService } from './services/socket-auth.service';

// The secret is passed on every check, so the JWT module needs no options of its own here.
@Module({
  imports: [JwtModule.register({}), UsersModule],
  providers: [SocketAuthService],
  exports: [SocketAuthService],
})
export class RealtimeModule {}
