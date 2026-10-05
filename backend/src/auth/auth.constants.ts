import { CronExpression } from '@nestjs/schedule';
import {
  GLOBAL_PREFIX,
  MS_PER_MINUTE,
  MS_PER_SECOND,
  SECONDS_PER_DAY,
  SECONDS_PER_MINUTE,
} from '../common/common.constants';
import { OAUTH_PROVIDER } from '../common/enums/oauth-provider.enum';

// Routes
const CALLBACK_SEGMENT = 'callback';

export const AUTH_ROUTES = {
  BASE: 'auth',
  REGISTER: 'register',
  LOGIN: 'login',
  REFRESH: 'refresh',
  LOGOUT: 'logout',
  ME: 'me',
  GOOGLE: OAUTH_PROVIDER.GOOGLE,
  GOOGLE_CALLBACK: `${OAUTH_PROVIDER.GOOGLE}/${CALLBACK_SEGMENT}`,
  YANDEX: OAUTH_PROVIDER.YANDEX,
  YANDEX_CALLBACK: `${OAUTH_PROVIDER.YANDEX}/${CALLBACK_SEGMENT}`,
} as const;

// Errors
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  ACCOUNT_BLOCKED: 'Аккаунт заблокирован',
  INVALID_SESSION: 'Сессия недействительна, войдите снова',
  UNAUTHORIZED: 'Требуется авторизация',
} as const;

// Validation
export const EMAIL_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_LOGIN_MIN_LENGTH = 1;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const PHONE_MIN_DIGITS = 10;
export const PHONE_MAX_DIGITS = 15;

export const PASSWORD_UPPERCASE_REGEX = /[A-ZА-ЯЁ]/;
export const PASSWORD_LOWERCASE_REGEX = /[a-zа-яё]/;
export const PASSWORD_DIGIT_REGEX = /\d/;
export const PASSWORD_SPECIAL_REGEX = /[^A-Za-zА-Яа-яЁё\d\s]/;
export const PHONE_REGEX = new RegExp(`^\\+\\d{${PHONE_MIN_DIGITS},${PHONE_MAX_DIGITS}}$`);
export const PHONE_SEPARATORS_REGEX = /[\s\-()]/g;
export const PHONE_SEPARATOR_REPLACEMENT = '';

export const AUTH_VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'Введите корректный email',
  EMAIL_TOO_LONG: `Email должен содержать не больше ${EMAIL_MAX_LENGTH} символов`,
  FIRST_NAME_TOO_SHORT: `Имя должно содержать минимум ${NAME_MIN_LENGTH} символа`,
  FIRST_NAME_TOO_LONG: `Имя должно содержать не больше ${NAME_MAX_LENGTH} символов`,
  LAST_NAME_TOO_SHORT: `Фамилия должна содержать минимум ${NAME_MIN_LENGTH} символа`,
  LAST_NAME_TOO_LONG: `Фамилия должна содержать не больше ${NAME_MAX_LENGTH} символов`,
  PHONE_INVALID: 'Введите телефон в международном формате, например +375291234567',
  PASSWORD_TOO_SHORT: `Пароль должен содержать минимум ${PASSWORD_MIN_LENGTH} символов`,
  PASSWORD_TOO_LONG: `Пароль должен содержать не больше ${PASSWORD_MAX_LENGTH} символов`,
  PASSWORD_NO_UPPERCASE: 'Пароль должен содержать заглавную букву',
  PASSWORD_NO_LOWERCASE: 'Пароль должен содержать строчную букву',
  PASSWORD_NO_DIGIT: 'Пароль должен содержать хотя бы одну цифру',
  PASSWORD_NO_SPECIAL: 'Пароль должен содержать спецсимвол, например ! ? #',
  PASSWORD_REQUIRED: 'Введите пароль',
} as const;

// Tokens and cookies
export const ACCESS_TOKEN_TTL_MINUTES = 15;
export const ACCESS_TOKEN_TTL_SECONDS = ACCESS_TOKEN_TTL_MINUTES * SECONDS_PER_MINUTE;
export const ACCESS_TOKEN_TTL_MS = ACCESS_TOKEN_TTL_SECONDS * MS_PER_SECOND;

export const REFRESH_TOKEN_TTL_DAYS = 30;
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * SECONDS_PER_DAY * MS_PER_SECOND;
export const REFRESH_TOKEN_BYTES = 32;
export const REFRESH_TOKEN_ENCODING = 'base64url';

export const TOKEN_HASH_ALGORITHM = 'sha256';
export const TOKEN_HASH_ENCODING = 'hex';

export const ACCESS_COOKIE_NAME = 'access_token';
export const ACCESS_COOKIE_PATH = `/${GLOBAL_PREFIX}`;
export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = `/${GLOBAL_PREFIX}/${AUTH_ROUTES.BASE}`;
export const AUTH_COOKIE_SAME_SITE = 'lax';

// Throttling
export const AUTH_THROTTLE_LIMIT = 10;
export const AUTH_THROTTLE_TTL_MS = MS_PER_MINUTE;

export const AUTH_THROTTLE = {
  default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS },
};

// Cleanup
export const REFRESH_TOKEN_CLEANUP_CRON = CronExpression.EVERY_DAY_AT_3AM;

// Metadata keys
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const JWT_STRATEGY_NAME = 'jwt';

// Password
export const TIMING_DUMMY_PASSWORD = 'timing-equalization-password';

// OAuth
export const GOOGLE_STRATEGY_NAME = 'google';
export const GOOGLE_SCOPES = ['openid', 'email', 'profile'];

export const OAUTH_STATE_COOKIE_PREFIX = 'oauth_state_';
export const OAUTH_STATE_COOKIE_BASE_PATH = `/${GLOBAL_PREFIX}/${AUTH_ROUTES.BASE}`;
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

// Yandex
export const YANDEX_STRATEGY_NAME = 'yandex';
export const YANDEX_AUTHORIZATION_URL = 'https://oauth.yandex.ru/authorize';
export const YANDEX_TOKEN_URL = 'https://oauth.yandex.ru/token';
export const YANDEX_PROFILE_URL = 'https://login.yandex.ru/info?format=json';
export const YANDEX_AUTH_HEADER_SCHEME = 'OAuth';
export const YANDEX_PROFILE_TIMEOUT_MS = 5000;
