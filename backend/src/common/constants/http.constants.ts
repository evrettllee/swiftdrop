import { MS_PER_MINUTE } from './time.constants';

// Application
export const GLOBAL_PREFIX = 'api';

// Throttling
// The name that @nestjs/throttler gives to a throttler registered without one.
export const DEFAULT_THROTTLER_NAME = 'default';
export const DEFAULT_THROTTLE_LIMIT = 100;
export const DEFAULT_THROTTLE_TTL_MS = MS_PER_MINUTE;
export const THROTTLE_ERROR_MESSAGE = 'Слишком много запросов, попробуйте позже';

// Validation
export const VALIDATION_ERROR_MESSAGE = 'Ошибка валидации';
export const ISSUE_PATH_SEPARATOR = '.';
