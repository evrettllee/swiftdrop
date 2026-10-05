import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { JWT_STRATEGY_NAME, AUTH_ERROR_MESSAGES } from '../auth.constants';
import { toAuthUser } from '../auth-user.mapper';
import type { AccessTokenPayload, AuthUser } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
