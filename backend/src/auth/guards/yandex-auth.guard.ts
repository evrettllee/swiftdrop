import { Injectable } from '@nestjs/common';
import { OAUTH_PROVIDER } from '../../common/enums/oauth-provider.enum';
import { YANDEX_STRATEGY_NAME } from '../yandex.constants';
import { createOAuthInitiateGuard } from './oauth-guard.factory';

@Injectable()
export class YandexAuthGuard extends createOAuthInitiateGuard(
  YANDEX_STRATEGY_NAME,
  OAUTH_PROVIDER.YANDEX,
) {}
