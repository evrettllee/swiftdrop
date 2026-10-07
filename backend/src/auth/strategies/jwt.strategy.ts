import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { ENV_KEYS } from '../../config/env.constants';
import { UsersService } from '../../users/users.service';
import { readCookie } from '../auth-cookies.service';
import { AUTH_ERROR_MESSAGES, JWT_STRATEGY_NAME } from '../constants/access.constants';
import { ACCESS_COOKIE_NAME } from '../constants/tokens.constants';
import { toAuthUser } from '../auth-user.mapper';
import type { AccessTokenPayload, AuthUser } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      // passport-jwt treats null as "no token", so the missing cookie is reported as null.
      jwtFromRequest: (request: Request) => readCookie(request, ACCESS_COOKIE_NAME) ?? null,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>(ENV_KEYS.JWT_ACCESS_SECRET),
    });
  }

  // Reads the user on every request, so blocking or deleting an account takes effect immediately.
  async validate(payload: AccessTokenPayload): Promise<AuthUser> {
    const user = await this.usersService.findById(Number(payload.sub));

    if (!user || user.isBlocked) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.INVALID_SESSION);
    }

    return toAuthUser(user, user.roleName);
  }
}
