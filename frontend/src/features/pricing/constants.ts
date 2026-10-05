import { CHECKBOX_UNCHECKED_VALUE, HTTP_STATUS } from '../../shared/constants';

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

// The names are the same as in the API body, so the parsed form is the package of the request.
export const PACKAGE_FIELD = {
  WEIGHT: 'weightKg',
  LENGTH: 'lengthCm',
  WIDTH: 'widthCm',
  HEIGHT: 'heightCm',
  FRAGILE: 'isFragile',
} as const;

// A typical small parcel: the price appears as soon as both addresses are set.
export const PACKAGE_DEFAULTS = {
  [PACKAGE_FIELD.WEIGHT]: '1',
  [PACKAGE_FIELD.LENGTH]: '30',
  [PACKAGE_FIELD.WIDTH]: '20',
  [PACKAGE_FIELD.HEIGHT]: '10',
  [PACKAGE_FIELD.FRAGILE]: CHECKBOX_UNCHECKED_VALUE,
} as const;

export const PACKAGE_DIMENSIONS = [
  { name: PACKAGE_FIELD.LENGTH, label: 'Длина' },
  { name: PACKAGE_FIELD.WIDTH, label: 'Ширина' },
  { name: PACKAGE_FIELD.HEIGHT, label: 'Высота' },
] as const;

export const DECIMAL_PATTERN = /^\d+([.,]\d+)?$/;
export const WHOLE_PATTERN = /^\d+$/;
export const DECIMAL_COMMA = ',';
export const DECIMAL_POINT = '.';

export const PACKAGE_ERRORS = {
  REQUIRED: 'Заполните поле',
  NOT_NUMBER: 'Нужно число',
  NOT_WHOLE: 'Только целое',
  NOT_POSITIVE: 'Больше нуля',
} as const;

export const CALCULATOR_TEXTS = {
  WEIGHT: 'Вес',
  FRAGILE: 'Хрупкая посылка',
  UNIT_KG: 'кг',
  UNIT_CM: 'см',
  ESTIMATE_LABEL: 'Ориентировочная стоимость',
  NEEDS_ADDRESSES: 'Укажите оба адреса, и мы покажем стоимость',
  NEEDS_PACKAGE: 'Проверьте вес и размеры посылки',
  LOADING: 'Считаем стоимость',
  IN_ZONE: 'Оба адреса в зоне обслуживания',
  APPROX: '≈',
  DISTANCE_SUFFIX: 'км по маршруту',
  DURATION_SUFFIX: 'мин в пути',
} as const;
