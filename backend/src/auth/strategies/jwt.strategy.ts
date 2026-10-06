import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { AUTH_ERROR_MESSAGES, JWT_STRATEGY_NAME } from '../constants/access';
import { ACCESS_COOKIE_NAME } from '../constants/tokens';
import { toAuthUser } from '../auth-user.mapper';
import type { AccessTokenPayload, AuthUser } from '../auth.types';

// A plain function, because it is needed before `this` exists in the constructor.
function extractAccessToken(request: Request): string | null {
  const value: unknown = request.cookies?.[ACCESS_COOKIE_NAME];

  return typeof value === 'string' ? value : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: extractAccessToken,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
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
