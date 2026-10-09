import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { z } from 'zod';
import { NAME_MAX_LENGTH } from '../../common/constants/person-validation.constants';
import { OAUTH_PROVIDER } from '../../common/enums/oauth-provider.enum';
import { ENV_KEYS } from '../../config/env.constants';
import {
  OAUTH_ERROR_MESSAGES,
  YANDEX_AUTH_HEADER_SCHEME,
  YANDEX_AUTHORIZATION_URL,
  YANDEX_PROFILE_TIMEOUT_MS,
  YANDEX_PROFILE_URL,
  YANDEX_STRATEGY_NAME,
  YANDEX_TOKEN_URL,
} from '../constants/oauth.constants';
import type { OAuthProfile } from '../auth.types';

const yandexProfileSchema = z.object({
  id: z.string().min(1),
  default_email: z.email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  login: z.string().optional(),
});

export type YandexProfile = z.infer<typeof yandexProfileSchema>;

@Injectable()
export class YandexStrategy extends PassportStrategy(Strategy, YANDEX_STRATEGY_NAME) {
  constructor(config: ConfigService) {
    super({
      authorizationURL: YANDEX_AUTHORIZATION_URL,
      tokenURL: YANDEX_TOKEN_URL,
      clientID: config.getOrThrow<string>(ENV_KEYS.YANDEX_CLIENT_ID),
      clientSecret: config.getOrThrow<string>(ENV_KEYS.YANDEX_CLIENT_SECRET),
      callbackURL: config.getOrThrow<string>(ENV_KEYS.YANDEX_CALLBACK_URL),
    });
  }

  async validate(accessToken: string): Promise<OAuthProfile> {
    const parsed = yandexProfileSchema.safeParse(await this.fetchProfile(accessToken));

    if (!parsed.success) {
      throw new UnauthorizedException(OAUTH_ERROR_MESSAGES.LOGIN_FAILED);
    }

    const profile = parsed.data;

    if (!profile.default_email) {
      throw new UnauthorizedException(OAUTH_ERROR_MESSAGES.EMAIL_MISSING);
    }

    const firstName = profile.first_name || profile.display_name || profile.login || '';

    return {
      provider: OAUTH_PROVIDER.YANDEX,
      providerUserId: profile.id,
      email: profile.default_email.toLowerCase(),
      // Yandex does not report verification status: the address of a Yandex account is Yandex's own.
      emailVerified: true,
      firstName: firstName.slice(0, NAME_MAX_LENGTH),
      lastName: (profile.last_name ?? '').slice(0, NAME_MAX_LENGTH),
    };
  }

  private async fetchProfile(accessToken: string): Promise<unknown> {
    const response = await fetch(YANDEX_PROFILE_URL, {
      headers: { Authorization: `${YANDEX_AUTH_HEADER_SCHEME} ${accessToken}` },
      signal: AbortSignal.timeout(YANDEX_PROFILE_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new UnauthorizedException(OAUTH_ERROR_MESSAGES.LOGIN_FAILED);
    }

    return response.json();
  }
}
