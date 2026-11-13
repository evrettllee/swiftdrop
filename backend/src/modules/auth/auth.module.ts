import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ENV_KEYS } from '@/config/env.constants';
import { MailModule } from '@/integrations/mail/mail.module';
import { UsersModule } from '@/modules/users/users.module';
import { AuthCookiesService } from './services/auth-cookies.service';
import { ACCESS_TOKEN_TTL_SECONDS } from './constants/tokens.constants';
import { AuthController } from './controllers/auth.controller';
import { PasswordLinksController } from './controllers/password-links.controller';
import { AuthService } from './services/auth.service';
import { OAuthService } from './services/oauth.service';
import { OAuthStateService } from './services/oauth-state.service';
import { PasswordLinksService } from './services/password-links.service';
import { PasswordService } from './services/password.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { YandexStrategy } from './strategies/yandex.strategy';
import { TokensCleanupJob } from './jobs/tokens-cleanup.job';
import { TokensCleanupService } from './services/tokens-cleanup.service';
import { TokensService } from './services/tokens.service';

@Module({
  imports: [
    MailModule,
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>(ENV_KEYS.JWT_ACCESS_SECRET),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
      }),
    }),
  ],
  controllers: [AuthController, PasswordLinksController],
  providers: [
    AuthService,
    AuthCookiesService,
    GoogleStrategy,
    JwtStrategy,
    OAuthService,
    OAuthStateService,
    PasswordLinksService,
    PasswordService,
    TokensCleanupJob,
    TokensCleanupService,
    TokensService,
    YandexStrategy,
  ],
  exports: [PasswordLinksService],
})
export class AuthModule {}
