import { GLOBAL_PREFIX } from '../common/constants/app.constants';
import {
  MS_PER_SECOND,
  SECONDS_PER_DAY,
  SECONDS_PER_MINUTE,
} from '../common/constants/time.constants';
import { AUTH_ROUTES } from './auth-routes.constants';

export const ACCESS_TOKEN_TTL_MINUTES = 15;
export const ACCESS_TOKEN_TTL_SECONDS = ACCESS_TOKEN_TTL_MINUTES * SECONDS_PER_MINUTE;

export const REFRESH_TOKEN_TTL_DAYS = 30;
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * SECONDS_PER_DAY * MS_PER_SECOND;
export const REFRESH_TOKEN_BYTES = 32;
export const REFRESH_TOKEN_ENCODING = 'base64url';

export const TOKEN_HASH_ALGORITHM = 'sha256';
export const TOKEN_HASH_ENCODING = 'hex';

export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = `/${GLOBAL_PREFIX}/${AUTH_ROUTES.BASE}`;
export const REFRESH_COOKIE_SAME_SITE = 'lax';
