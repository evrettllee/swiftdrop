import { GLOBAL_PREFIX } from '../common/constants/app.constants';
import { MS_PER_MINUTE } from '../common/constants/time.constants';
import { AUTH_ROUTES } from './auth-routes.constants';

export const GOOGLE_STRATEGY_NAME = 'google';
export const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

export const OAUTH_STATE_COOKIE_NAME = 'oauth_state';
export const OAUTH_STATE_COOKIE_PATH = `/${GLOBAL_PREFIX}/${AUTH_ROUTES.BASE}/${AUTH_ROUTES.GOOGLE}`;
export const OAUTH_STATE_BYTES = 16;
export const OAUTH_STATE_ENCODING = 'base64url';
export const OAUTH_STATE_TTL_MINUTES = 10;
export const OAUTH_STATE_TTL_MS = OAUTH_STATE_TTL_MINUTES * MS_PER_MINUTE;

export const OAUTH_SUCCESS_REDIRECT = '/';
export const OAUTH_FAILURE_REDIRECT = '/auth?error=oauth_failed';
export const OAUTH_BLOCKED_REDIRECT = '/auth?error=account_blocked';

export const OAUTH_ERROR_MESSAGES = {
  EMAIL_MISSING: 'Провайдер не передал email',
  EMAIL_NOT_VERIFIED: 'Email не подтверждён у провайдера',
  INVALID_STATE: 'Недействительный параметр state',
  LOGIN_FAILED: 'Не удалось войти через провайдера',
  UNKNOWN_ERROR: 'Неизвестная ошибка',
} as const;
