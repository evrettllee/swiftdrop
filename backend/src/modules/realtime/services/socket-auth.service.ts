import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MS_PER_SECOND } from '../../../common/constants/time.constants';
import { describeError } from '../../../common/utils/describe-error';
import { ENV_KEYS } from '../../../config/env.constants';
import { ACCESS_COOKIE_NAME } from '../../auth/constants/tokens.constants';
import { toAuthUser } from '../../auth/mappers/auth-user.mapper';
import type { AccessTokenPayload } from '../../auth/types/auth.types';
import { UsersService } from '../../users/services/users.service';
import type { SocketSession } from '../types/realtime.types';
import { parseCookieHeader } from '../utils/cookie-header';

type VerifiedPayload = AccessTokenPayload & { exp: number };

@Injectable()
export class SocketAuthService {
  private readonly logger = new Logger(SocketAuthService.name);
  private readonly secret: string;

  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    config: ConfigService,
  ) {
    this.secret = config.getOrThrow<string>(ENV_KEYS.JWT_ACCESS_SECRET);
  }

  // The same checks as the HTTP strategy: a valid access token and an existing, unblocked user.
  // Returns null when there is no such session.
  async authenticate(cookieHeader: string | undefined): Promise<SocketSession | null> {
    const token = parseCookieHeader(cookieHeader)[ACCESS_COOKIE_NAME];
    let session: SocketSession | null = null;

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<VerifiedPayload>(token, { secret: this.secret });
        const user = await this.users.findById(Number(payload.sub));

        if (user && !user.isBlocked) {
          session = {
            user: toAuthUser(user, user.roleName),
            expiresAtMs: payload.exp * MS_PER_SECOND,
          };
        }
      } catch (error) {
        this.logger.debug(`Socket token rejected: ${describeError(error)}`);
      }
    }

    return session;
  }
}
