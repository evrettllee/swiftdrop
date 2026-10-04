import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { NODE_ENV_PRODUCTION } from '../common/constants/env.constants';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  REFRESH_COOKIE_SAME_SITE,
  REFRESH_TOKEN_TTL_MS,
} from './auth-token.constants';
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_COOKIE_PATH,
  OAUTH_STATE_TTL_MS,
} from './oauth.constants';

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

  setOAuthState(response: Response, state: string): void {
    response.cookie(OAUTH_STATE_COOKIE_NAME, state, {
      ...this.buildBaseOptions(OAUTH_STATE_COOKIE_PATH),
      maxAge: OAUTH_STATE_TTL_MS,
    });
  }

  clearOAuthState(response: Response): void {
    response.clearCookie(OAUTH_STATE_COOKIE_NAME, this.buildBaseOptions(OAUTH_STATE_COOKIE_PATH));
  }

  getOAuthState(request: Request): string | undefined {
    return this.readCookie(request, OAUTH_STATE_COOKIE_NAME);
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
