import { HTTP_STATUS } from '../../../shared/constants/api';

// API
export const PRICING_API_PATHS = {
  ESTIMATES: '/pricing/estimates',
} as const;

// The backend explains a 422 itself (out of the zone, too heavy), so only two statuses are replaced:
// 429 comes from the throttler without a Russian text, 503 means the routing service is down.
export const ESTIMATE_STATUS_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Слишком много расчётов подряд. Подождите минуту и повторите',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Не удалось построить маршрут. Попробуйте ещё раз чуть позже',
};

// Formatting
export const PRICING_LOCALE = 'ru-RU';
export const PRICE_FRACTION_DIGITS = 2;
export const DISTANCE_FRACTION_DIGITS = 1;

// The request goes out when the form has not changed for this long: the backend allows
// only 30 estimates per minute from one address.
export const ESTIMATE_DEBOUNCE_MS = 500;

export const ESTIMATE_STATUS = {
  NEEDS_ADDRESSES: 'needs-addresses',
  NEEDS_PACKAGE: 'needs-package',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;
