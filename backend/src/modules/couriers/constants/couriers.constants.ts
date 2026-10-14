import { VEHICLE_FIELD_LENGTH } from '../../../common/constants/field-lengths.constants';
import { VEHICLE_TYPE, type VehicleType } from '../../../common/enums/vehicle-type.enum';

// Routes
export const COURIERS_ROUTES = {
  BASE: 'couriers',
  ME: 'me',
  VEHICLE: 'me/vehicle',
  AVAILABILITY: 'me/availability',
} as const;

// Vehicles
// Only these need a brand, a model and a plate: a courier on foot, a bike or a scooter has none.
export const VEHICLES_WITH_REGISTRATION: readonly VehicleType[] = [
  VEHICLE_TYPE.CAR,
  VEHICLE_TYPE.TRUCK,
];

export const VEHICLE_TEXT_MIN_LENGTH = 1;
export const LICENSE_PLATE_MIN_LENGTH = 4;
// Letters, digits, spaces and hyphens, starting and ending with a letter or a digit (1234 AB-7).
export const LICENSE_PLATE_PATTERN = /^[0-9A-ZА-ЯЁ](?:[0-9A-ZА-ЯЁ -]*[0-9A-ZА-ЯЁ])?$/u;

// Validation
export const COURIERS_VALIDATION_MESSAGES = {
  TYPE_INVALID: 'Выберите тип транспорта',
  BRAND_REQUIRED: 'Укажите марку',
  BRAND_TOO_LONG: `Марка должна содержать не больше ${VEHICLE_FIELD_LENGTH.BRAND} символов`,
  MODEL_REQUIRED: 'Укажите модель',
  MODEL_TOO_LONG: `Модель должна содержать не больше ${VEHICLE_FIELD_LENGTH.MODEL} символов`,
  PLATE_REQUIRED: 'Укажите госномер',
  PLATE_INVALID: 'Введите госномер как на номерном знаке, например 1234 AB-7',
  AVAILABILITY_INVALID: 'Укажите, выходите ли вы на линию',
} as const;

// Errors
export const COURIERS_ERROR_MESSAGES = {
  PROFILE_NOT_FOUND: 'Профиль курьера не найден',
  ON_SHIFT: 'Сначала уйдите с линии, потом меняйте транспорт',
  ON_ORDER: 'Транспорт нельзя менять во время заказа',
  VEHICLE_REQUIRED: 'Укажите транспорт, чтобы выйти на линию',
  // The profile row is held by another operation (going on shift, another vehicle change).
  BUSY: 'Профиль сейчас обновляется. Попробуйте ещё раз',
} as const;
