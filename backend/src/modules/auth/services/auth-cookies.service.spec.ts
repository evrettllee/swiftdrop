import type { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { ENV_KEYS, NODE_ENV_PRODUCTION } from '../../../config/env.constants';
import {
  ACCESS_COOKIE_NAME,
  AUTH_COOKIE_SAME_SITE,
  REFRESH_COOKIE_NAME,
} from '../constants/tokens.constants';
import { AuthCookiesService } from './auth-cookies.service';

const NODE_ENV_DEVELOPMENT = 'development';
const SESSION = { accessToken: 'access', refreshToken: 'refresh' };

// The service reads NODE_ENV through ConfigService only, so the fake decides the environment.
function createService(nodeEnv: string): AuthCookiesService {
  const config: Pick<ConfigService, 'get'> = {
    get: (key: string) => (key === ENV_KEYS.NODE_ENV ? nodeEnv : undefined),
  };

  return new AuthCookiesService(config as ConfigService);
}

// The options of every cookie the service sets, by cookie name.
function captureCookies(service: AuthCookiesService): Map<string, CookieOptions> {
  const cookies = new Map<string, CookieOptions>();
  const response: Pick<Response, 'cookie'> = {
    cookie(name: string, _value: unknown, options?: CookieOptions) {
      cookies.set(name, options ?? {});

      return this as Response;
    },
  };

  service.setSession(response as Response, SESSION);

  return cookies;
}

describe('AuthCookiesService', () => {
  it.each([ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME])(
    'should set %s as httpOnly, SameSite and Secure when running in production',
    (name) => {
      const options = captureCookies(createService(NODE_ENV_PRODUCTION)).get(name);

      expect(options).toEqual(
        expect.objectContaining({ httpOnly: true, sameSite: AUTH_COOKIE_SAME_SITE, secure: true }),
      );
    },
  );

  it.each([ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME])(
    'should set %s without Secure but still httpOnly when running in development',
    (name) => {
      const options = captureCookies(createService(NODE_ENV_DEVELOPMENT)).get(name);

      expect(options).toEqual(
        expect.objectContaining({ httpOnly: true, sameSite: AUTH_COOKIE_SAME_SITE, secure: false }),
      );
    },
  );
});
