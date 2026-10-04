import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthCookiesService } from './auth-cookies.service';
import { ACCESS_TOKEN_TTL_SECONDS } from './auth-token.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { OAuthStateService } from './oauth-state.service';
import { PasswordService } from './password.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokensCleanupService } from './tokens-cleanup.service';
import { TokensService } from './tokens.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCookiesService,
    GoogleStrategy,
    JwtStrategy,
    OAuthService,
    OAuthStateService,
    PasswordService,
    TokensCleanupService,
    TokensService,
  ],
})
export class AuthModule {}
