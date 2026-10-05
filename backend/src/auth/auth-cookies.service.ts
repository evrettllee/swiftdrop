import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { NODE_ENV_PRODUCTION } from '../common/common.constants';
import type { OAuthProvider } from '../common/enums/oauth-provider.enum';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_COOKIE_SAME_SITE,
  REFRESH_TOKEN_TTL_MS,
  OAUTH_STATE_COOKIE_BASE_PATH,
  OAUTH_STATE_COOKIE_PREFIX,
  OAUTH_STATE_TTL_MS,
} from './auth.constants';

@Injectable()
export class AuthCookiesService {
  constructor(private readonly config: ConfigService) {}

  setRefreshToken(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...this.buildBaseOptions(REFRESH_COOKIE_PATH),
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  clearRefreshToken(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, this.buildBaseOptions(REFRESH_COOKIE_PATH));
  }

  getRefreshToken(request: Request): string | undefined {
    return this.readCookie(request, REFRESH_COOKIE_NAME);
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
    return this.readCookie(request, this.buildStateCookieName(provider));
  }

  private buildStateCookieName(provider: OAuthProvider): string {
    return `${OAUTH_STATE_COOKIE_PREFIX}${provider}`;
  }

  // The provider name doubles as the route segment, so the cookie is sent only to that provider's routes.
  private buildStateCookiePath(provider: OAuthProvider): string {
    return `${OAUTH_STATE_COOKIE_BASE_PATH}/${provider}`;
  }

  private readCookie(request: Request, name: string): string | undefined {
    const value: unknown = request.cookies?.[name];

    return typeof value === 'string' ? value : undefined;
  }

  // Options must match between set and clear, otherwise the browser keeps the cookie.
  private buildBaseOptions(path: string): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === NODE_ENV_PRODUCTION,
      sameSite: REFRESH_COOKIE_SAME_SITE,
      path,
    };
  }
}
