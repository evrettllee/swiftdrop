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

@Injectable()
export class AuthCookiesService {
  constructor(private readonly config: ConfigService) {}

  setRefreshToken(response: Response, refreshToken: string): void {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      ...this.buildBaseOptions(),
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }

  clearRefreshToken(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, this.buildBaseOptions());
  }

  getRefreshToken(request: Request): string | undefined {
    const value: unknown = request.cookies?.[REFRESH_COOKIE_NAME];

    return typeof value === 'string' ? value : undefined;
  }

  // Options must match between set and clear, otherwise the browser keeps the cookie.
  private buildBaseOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === NODE_ENV_PRODUCTION,
      sameSite: REFRESH_COOKIE_SAME_SITE,
      path: REFRESH_COOKIE_PATH,
    };
  }
}
