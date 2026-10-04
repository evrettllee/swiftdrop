import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  mixin,
  type Type,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import type { OAuthProvider } from '../../common/enums/oauth-provider.enum';
import { OAUTH_ERROR_MESSAGES } from '../oauth.constants';
import { OAuthStateService } from '../oauth-state.service';

// Starts the redirect to the provider and issues the state value that the callback will check.
export function createOAuthInitiateGuard(
  strategyName: string,
  provider: OAuthProvider,
): Type<CanActivate> {
  @Injectable()
  class OAuthInitiateGuard extends AuthGuard(strategyName) {
    constructor(@Inject(OAuthStateService) private readonly oauthStateService: OAuthStateService) {
      super();
    }

    getAuthenticateOptions(context: ExecutionContext): { state: string } {
      const response = context.switchToHttp().getResponse<Response>();

      return { state: this.oauthStateService.issue(response, provider) };
    }
  }

  return mixin(OAuthInitiateGuard);
}

// Verifies the state first, so a forged callback never reaches the token exchange.
export function createOAuthCallbackGuard(
  strategyName: string,
  provider: OAuthProvider,
): Type<CanActivate> {
  @Injectable()
  class OAuthCallbackGuard extends AuthGuard(strategyName) {
    constructor(@Inject(OAuthStateService) private readonly oauthStateService: OAuthStateService) {
      super();
    }

    canActivate(context: ExecutionContext) {
      const http = context.switchToHttp();
      const isStateValid = this.oauthStateService.verify(
        http.getRequest<Request>(),
        http.getResponse<Response>(),
        provider,
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

  return mixin(OAuthCallbackGuard);
}
