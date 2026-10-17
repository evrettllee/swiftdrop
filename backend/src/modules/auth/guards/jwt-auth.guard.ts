import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { HTTP_CONTEXT_TYPE } from '../../../common/constants/http.constants';
import {
  AUTH_ERROR_MESSAGES,
  IS_PUBLIC_KEY,
  JWT_STRATEGY_NAME,
} from '../constants/access.constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGY_NAME) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  // A socket is checked once, in its handshake, by the middleware of its gateway: the passport
  // strategy reads an HTTP request and cannot run on socket messages.
  canActivate(context: ExecutionContext) {
    const isHttp = context.getType() === HTTP_CONTEXT_TYPE;
    const isPublic = this.reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return !isHttp || isPublic ? true : super.canActivate(context);
  }

  // Replaces the default English "Unauthorized" text for missing or invalid tokens.
  handleRequest<TUser>(error: unknown, user: TUser | false): TUser {
    if (error || !user) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.UNAUTHORIZED);
    }

    return user;
  }
}
