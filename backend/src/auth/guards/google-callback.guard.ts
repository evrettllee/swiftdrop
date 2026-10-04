import { Injectable } from '@nestjs/common';
import { OAUTH_PROVIDER } from '../../common/enums/oauth-provider.enum';
import { GOOGLE_STRATEGY_NAME } from '../oauth.constants';
import { createOAuthCallbackGuard } from './oauth-guard.factory';

@Injectable()
export class GoogleCallbackGuard extends createOAuthCallbackGuard(
  GOOGLE_STRATEGY_NAME,
  OAUTH_PROVIDER.GOOGLE,
) {}
