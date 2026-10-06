import { MS_PER_MINUTE } from '../common/constants/time';
import type { VehicleType } from '../common/enums/vehicle-type.enum';
import { buildThrottleOverride } from '../common/utils/throttle';

// Routes
export const PRICING_ROUTES = {
  BASE: 'pricing',
  ESTIMATES: 'estimates',
} as const;

// Package class multipliers: the heavier the lightest suitable transport, the higher the price.
export const CLASS_MULTIPLIERS: Record<VehicleType, number> = {
  foot: 1,
  bicycle: 1,
  scooter: 1.1,
  car: 1.3,
  truck: 2,
};

// Demand coefficient bounds: there are no discounts, and the total is capped.
export const COEFFICIENT_MIN = 1;
export const COEFFICIENT_MAX = 2;
export const NEUTRAL_COEFFICIENT = COEFFICIENT_MIN;

// Money
export const CENTS_PER_UNIT = 100;
// Trims float noise such as 922.4999999999999 before rounding to cents.
export const MONEY_PRECISION_DIGITS = 12;
export const CURRENCY = 'BYN';

// Estimate
// Time for a courier to reach the pickup point, added to the route time before an order exists.
export const PICKUP_BUFFER_MINUTES = 10;
// Matches the numeric(8, 2) column that stores the distance of an order.
export const DISTANCE_PRECISION_FACTOR = 100;

// Geography
export const LATITUDE_MIN = -90;
export const LATITUDE_MAX = 90;
export const LONGITUDE_MIN = -180;
export const LONGITUDE_MAX = 180;

// Errors
export const PRICING_ERROR_MESSAGES = {
  NO_VEHICLE: 'Посылка слишком большая или тяжёлая для нашего транспорта',
  PICKUP_OUT_OF_ZONE: 'Адрес забора вне зоны обслуживания',
  DELIVERY_OUT_OF_ZONE: 'Адрес доставки вне зоны обслуживания',
  TARIFF_NOT_FOUND: 'Тариф для выбранной зоны не найден',
} as const;

// Validation
export const PRICING_VALIDATION_MESSAGES = {
  LATITUDE_INVALID: `Широта должна быть числом от ${LATITUDE_MIN} до ${LATITUDE_MAX}`,
  LONGITUDE_INVALID: `Долгота должна быть числом от ${LONGITUDE_MIN} до ${LONGITUDE_MAX}`,
  PACKAGE_VALUE_INVALID: 'Вес и размеры посылки должны быть положительными числами',
  FRAGILE_INVALID: 'Признак хрупкой посылки должен быть true или false',
} as const;

// Throttling
// Stricter than the global limit: every estimate calls the external routing service.
export const PRICING_THROTTLE_LIMIT = 30;
export const PRICING_THROTTLE_TTL_MS = MS_PER_MINUTE;

export const PRICING_THROTTLE = buildThrottleOverride(
  PRICING_THROTTLE_LIMIT,
  PRICING_THROTTLE_TTL_MS,
);
