// Application
export const GLOBAL_PREFIX = 'api';

// Environment
export const NODE_ENV_PRODUCTION = 'production';

// Time
export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_DAY = 86400;
export const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;

// Throttling
export const DEFAULT_THROTTLE_LIMIT = 100;
export const DEFAULT_THROTTLE_TTL_MS = MS_PER_MINUTE;
export const THROTTLE_ERROR_MESSAGE = 'Слишком много запросов, попробуйте позже';

// Validation
export const VALIDATION_ERROR_MESSAGE = 'Ошибка валидации';
export const ISSUE_PATH_SEPARATOR = '.';

// Access
export const FORBIDDEN_MESSAGE = 'Недостаточно прав';

// Database and queries
export const PG_UNIQUE_VIOLATION_CODE = '23505';
export const SINGLE_ROW_LIMIT = 1;
