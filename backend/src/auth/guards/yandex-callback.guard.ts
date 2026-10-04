import { Injectable } from '@nestjs/common';
import { OAUTH_PROVIDER } from '../../common/enums/oauth-provider.enum';
import { YANDEX_STRATEGY_NAME } from '../yandex.constants';
import { createOAuthCallbackGuard } from './oauth-guard.factory';

@Injectable()
export class YandexCallbackGuard extends createOAuthCallbackGuard(
  YANDEX_STRATEGY_NAME,
  OAUTH_PROVIDER.YANDEX,
) {}
