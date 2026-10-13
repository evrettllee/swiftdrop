import { GLOBAL_PREFIX } from '../../../common/constants/http.constants';
import { MS_PER_MINUTE } from '../../../common/constants/time.constants';
import { AUTH_ROUTES } from './routes.constants';
import { URL_SAFE_ENCODING } from './tokens.constants';

// Google
export const GOOGLE_STRATEGY_NAME = 'google';
export const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

// State
export const OAUTH_STATE_COOKIE_PREFIX = 'oauth_state_';
export const OAUTH_STATE_COOKIE_BASE_PATH = `/${GLOBAL_PREFIX}/${AUTH_ROUTES.BASE}`;
export const OAUTH_STATE_BYTES = 16;
export const OAUTH_STATE_ENCODING = URL_SAFE_ENCODING;
export const OAUTH_STATE_TTL_MINUTES = 10;
export const OAUTH_STATE_TTL_MS = OAUTH_STATE_TTL_MINUTES * MS_PER_MINUTE;

// Redirects
// The auth page of the frontend sends a signed-in user on to the home page of their role, the same
// way as after the email login.
export const OAUTH_SUCCESS_REDIRECT = '/auth';
export const OAUTH_FAILURE_REDIRECT = '/auth?error=oauth_failed';
export const OAUTH_BLOCKED_REDIRECT = '/auth?error=account_blocked';

// Errors
export const OAUTH_ERROR_MESSAGES = {
  EMAIL_MISSING: 'Провайдер не передал email',
  EMAIL_NOT_VERIFIED: 'Email не подтверждён у провайдера',
  INVALID_STATE: 'Недействительный параметр state',
  LOGIN_FAILED: 'Не удалось войти через провайдера',
  UNKNOWN_ERROR: 'Неизвестная ошибка',
} as const;

// Yandex
export const YANDEX_STRATEGY_NAME = 'yandex';
export const YANDEX_AUTHORIZATION_URL = 'https://oauth.yandex.ru/authorize';
export const YANDEX_TOKEN_URL = 'https://oauth.yandex.ru/token';
export const YANDEX_PROFILE_URL = 'https://login.yandex.ru/info?format=json';
export const YANDEX_AUTH_HEADER_SCHEME = 'OAuth';
export const YANDEX_PROFILE_TIMEOUT_MS = 5000;
