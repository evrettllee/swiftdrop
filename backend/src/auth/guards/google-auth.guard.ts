import { type ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { GOOGLE_STRATEGY_NAME } from '../oauth.constants';
import { OAuthStateService } from '../oauth-state.service';

@Injectable()
export class GoogleAuthGuard extends AuthGuard(GOOGLE_STRATEGY_NAME) {
  constructor(private readonly oauthStateService: OAuthStateService) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext): { state: string } {
    const response = context.switchToHttp().getResponse<Response>();

    return { state: this.oauthStateService.issue(response) };
  }
}
