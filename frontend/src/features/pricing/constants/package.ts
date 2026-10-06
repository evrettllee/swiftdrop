import { CHECKBOX_UNCHECKED_VALUE } from '../../../shared/constants/forms';

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
