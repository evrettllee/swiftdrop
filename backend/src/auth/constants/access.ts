import { MS_PER_MINUTE } from '../../common/constants/time';

// Errors
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Неверный email или пароль',
  ACCOUNT_BLOCKED: 'Аккаунт заблокирован',
  INVALID_SESSION: 'Сессия недействительна, войдите снова',
  UNAUTHORIZED: 'Требуется авторизация',
} as const;

export const FORBIDDEN_MESSAGE = 'Недостаточно прав';

// Throttling
export const AUTH_THROTTLE_LIMIT = 10;
export const AUTH_THROTTLE_TTL_MS = MS_PER_MINUTE;

export const AUTH_THROTTLE = {
  default: { limit: AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS },
};

// Metadata keys
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';
export const JWT_STRATEGY_NAME = 'jwt';

// Password
export const TIMING_DUMMY_PASSWORD = 'timing-equalization-password';
