import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { ENV_KEYS, NODE_ENV_PRODUCTION } from '../../../config/env.constants';
import type { OAuthProvider } from '../../../common/enums/oauth-provider.enum';
import {
  OAUTH_STATE_COOKIE_BASE_PATH,
  OAUTH_STATE_COOKIE_PREFIX,
  OAUTH_STATE_TTL_MS,
} from '../constants/oauth.constants';
import {
  ACCESS_COOKIE_NAME,
  ACCESS_COOKIE_PATH,
  ACCESS_TOKEN_TTL_MS,
  AUTH_COOKIE_SAME_SITE,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_TOKEN_TTL_MS,
} from '../constants/tokens.constants';
import type { AuthResult } from '../types/auth.types';
import { readCookie } from '../utils/request-cookies';

@Injectable()
export class AuthCookiesService {
  constructor(private readonly config: ConfigService) {}

  setSession(response: Response, tokens: Pick<AuthResult, 'accessToken' | 'refreshToken'>): void {
    response.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
      ...this.buildBaseOptions(ACCESS_COOKIE_PATH),
      maxAge: ACCESS_TOKEN_TTL_MS,
    });
    response.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      ...this.buildBaseOptions(REFRESH_COOKIE_PATH),
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  clearSession(response: Response): void {
    response.clearCookie(ACCESS_COOKIE_NAME, this.buildBaseOptions(ACCESS_COOKIE_PATH));
    response.clearCookie(REFRESH_COOKIE_NAME, this.buildBaseOptions(REFRESH_COOKIE_PATH));
  }

  getRefreshToken(request: Request): string | undefined {
    return readCookie(request, REFRESH_COOKIE_NAME);
  }

  setOAuthState(response: Response, provider: OAuthProvider, state: string): void {
    response.cookie(this.buildStateCookieName(provider), state, {
      ...this.buildBaseOptions(this.buildStateCookiePath(provider)),
      maxAge: OAUTH_STATE_TTL_MS,
    });
  }

  clearOAuthState(response: Response, provider: OAuthProvider): void {
    response.clearCookie(
      this.buildStateCookieName(provider),
      this.buildBaseOptions(this.buildStateCookiePath(provider)),
    );
  }

  getOAuthState(request: Request, provider: OAuthProvider): string | undefined {
    return readCookie(request, this.buildStateCookieName(provider));
  }

  private buildStateCookieName(provider: OAuthProvider): string {
    return `${OAUTH_STATE_COOKIE_PREFIX}${provider}`;
  }

  // The provider name doubles as the route segment, so the cookie is sent only to that provider's routes.
  private buildStateCookiePath(provider: OAuthProvider): string {
    return `${OAUTH_STATE_COOKIE_BASE_PATH}/${provider}`;
  }

  // Options must match between set and clear, otherwise the browser keeps the cookie.
  private buildBaseOptions(path: string): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<string>(ENV_KEYS.NODE_ENV) === NODE_ENV_PRODUCTION,
      sameSite: AUTH_COOKIE_SAME_SITE,
      path,
    };
  }
}
