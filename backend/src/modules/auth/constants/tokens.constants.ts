import { CronExpression } from '@nestjs/schedule';
import { GLOBAL_PREFIX } from '../../../common/constants/http.constants';
import {
  MS_PER_SECOND,
  SECONDS_PER_DAY,
  SECONDS_PER_MINUTE,
} from '../../../common/constants/time.constants';
import { AUTH_ROUTES } from './routes.constants';

// Tokens
// Random tokens go into cookies and URLs, so they are encoded in a URL-safe way.
export const URL_SAFE_ENCODING = 'base64url';

export const ACCESS_TOKEN_TTL_MINUTES = 15;
export const ACCESS_TOKEN_TTL_SECONDS = ACCESS_TOKEN_TTL_MINUTES * SECONDS_PER_MINUTE;
export const ACCESS_TOKEN_TTL_MS = ACCESS_TOKEN_TTL_SECONDS * MS_PER_SECOND;

export const REFRESH_TOKEN_TTL_DAYS = 30;
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * SECONDS_PER_DAY * MS_PER_SECOND;
export const REFRESH_TOKEN_BYTES = 32;
export const REFRESH_TOKEN_ENCODING = URL_SAFE_ENCODING;

// A token replaced by a rotation this short while ago is accepted once more: two tabs refreshed
// at the same moment. Later, its reuse is taken for a theft.
export const REFRESH_REUSE_GRACE_SECONDS = 30;
export const REFRESH_REUSE_GRACE_MS = REFRESH_REUSE_GRACE_SECONDS * MS_PER_SECOND;

export const TOKEN_HASH_ALGORITHM = 'sha256';
export const TOKEN_HASH_ENCODING = 'hex';

// Cookies
export const ACCESS_COOKIE_NAME = 'access_token';
export const ACCESS_COOKIE_PATH = `/${GLOBAL_PREFIX}`;
export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = `/${GLOBAL_PREFIX}/${AUTH_ROUTES.BASE}`;
export const AUTH_COOKIE_SAME_SITE = 'lax';

// Cleanup
export const REFRESH_TOKEN_CLEANUP_CRON = CronExpression.EVERY_DAY_AT_3AM;
