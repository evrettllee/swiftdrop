import { Injectable } from '@nestjs/common';
import { OAUTH_PROVIDER } from '../../common/enums/oauth-provider.enum';
import { GOOGLE_STRATEGY_NAME } from '../oauth.constants';
import { createOAuthInitiateGuard } from './oauth-guard.factory';

@Injectable()
export class GoogleAuthGuard extends createOAuthInitiateGuard(
  GOOGLE_STRATEGY_NAME,
  OAUTH_PROVIDER.GOOGLE,
) {}
