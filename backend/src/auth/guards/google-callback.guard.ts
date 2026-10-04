import { type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { GOOGLE_STRATEGY_NAME, OAUTH_ERROR_MESSAGES } from '../oauth.constants';
import { OAuthStateService } from '../oauth-state.service';

@Injectable()
export class GoogleCallbackGuard extends AuthGuard(GOOGLE_STRATEGY_NAME) {
  constructor(private readonly oauthStateService: OAuthStateService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const http = context.switchToHttp();
    const isStateValid = this.oauthStateService.verify(
      http.getRequest<Request>(),
      http.getResponse<Response>(),
    );

    if (!isStateValid) {
      throw new UnauthorizedException(OAUTH_ERROR_MESSAGES.INVALID_STATE);
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(error: unknown, user: TUser | false): TUser {
    if (error || !user) {
      throw new UnauthorizedException(OAUTH_ERROR_MESSAGES.LOGIN_FAILED);
    }

    return user;
  }
}
