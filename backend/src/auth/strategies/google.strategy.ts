import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { type Profile, Strategy } from 'passport-google-oauth20';
import { NAME_MAX_LENGTH } from '../../common/constants/person-validation.constants';
import { OAUTH_PROVIDER } from '../../common/enums/oauth-provider.enum';
import { ENV_KEYS } from '../../config/env.constants';
import {
  GOOGLE_SCOPES,
  GOOGLE_STRATEGY_NAME,
  OAUTH_ERROR_MESSAGES,
} from '../constants/oauth.constants';
import type { OAuthProfile } from '../auth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, GOOGLE_STRATEGY_NAME) {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>(ENV_KEYS.GOOGLE_CLIENT_ID),
      clientSecret: config.getOrThrow<string>(ENV_KEYS.GOOGLE_CLIENT_SECRET),
      callbackURL: config.getOrThrow<string>(ENV_KEYS.GOOGLE_CALLBACK_URL),
      scope: GOOGLE_SCOPES,
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): OAuthProfile {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException(OAUTH_ERROR_MESSAGES.EMAIL_MISSING);
    }

    const rawProfile: { email_verified?: unknown } = profile._json;

    return {
      provider: OAUTH_PROVIDER.GOOGLE,
      providerUserId: profile.id,
      email: email.toLowerCase(),
      emailVerified: rawProfile.email_verified === true,
      firstName: (profile.name?.givenName ?? profile.displayName).slice(0, NAME_MAX_LENGTH),
      lastName: (profile.name?.familyName ?? '').slice(0, NAME_MAX_LENGTH),
    };
  }
}
