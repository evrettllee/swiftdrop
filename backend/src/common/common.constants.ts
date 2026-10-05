import type { VehicleLimit } from './common.types';
import type { VehicleType } from './enums/vehicle-type.enum';

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

// CSRF protection
export const CSRF_HEADER_NAME = 'x-requested-with';
export const CSRF_HEADER_VALUE = 'swiftdrop';
export const CSRF_ERROR_MESSAGE = 'Запрос отклонён: не пройдена проверка источника';
export const SAFE_HTTP_METHODS: string[] = ['GET', 'HEAD', 'OPTIONS'];

// Database and queries
export const PG_UNIQUE_VIOLATION_CODE = '23505';
export const SINGLE_ROW_LIMIT = 1;

// Vehicles
export const VEHICLE_LIMITS: Record<VehicleType, VehicleLimit> = {
  foot: { maxWeightKg: 3, maxSidesCm: [40, 30, 20], allowsFragile: true },
  bicycle: { maxWeightKg: 5, maxSidesCm: [50, 40, 30], allowsFragile: false },
  scooter: { maxWeightKg: 10, maxSidesCm: [60, 40, 30], allowsFragile: true },
  car: { maxWeightKg: 30, maxSidesCm: [100, 60, 50], allowsFragile: true },
  truck: { maxWeightKg: 500, maxSidesCm: [200, 120, 120], allowsFragile: true },
};
