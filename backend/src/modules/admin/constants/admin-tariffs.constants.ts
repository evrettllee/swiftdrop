export const ADMIN_TARIFF_ROUTES = {
  TARIFFS: 'tariffs',
  TARIFF: 'tariffs/:tariffId',
  TARIFF_STATUS: 'tariffs/:tariffId/status',
} as const;

export const TARIFF_NAME_MIN_LENGTH = 2;
export const TARIFF_NAME_MAX_LENGTH = 50;

export const TARIFF_PRICE_MAX = {
  pricePerKm: 100,
  pricePerKg: 100,
  minPrice: 1000,
  fragileFee: 1000,
} as const;

export const TARIFF_FIELDS = [
  'name',
  'pricePerKm',
  'pricePerKg',
  'minPrice',
  'fragileFee',
] as const;

export const TARIFF_NAME_INDEX = 'tariffs_name_lower_uidx';

export const ADMIN_TARIFF_MESSAGES = {
  NAME_LENGTH: `Название от ${TARIFF_NAME_MIN_LENGTH} до ${TARIFF_NAME_MAX_LENGTH} символов`,
  NAME_TAKEN: 'Тариф с таким названием уже есть',
  NOTHING_TO_UPDATE: 'Укажите хотя бы одно поле',
  IS_ACTIVE_INVALID: 'Укажите isActive: true или false',
  TARIFF_ID_INVALID: 'Некорректный номер тарифа',
  NOT_FOUND: 'Тариф не найден',
  BUSY: 'Тариф сейчас изменяется. Попробуйте ещё раз',
  USED_BY_ZONES: (zones: string) => `Тариф нельзя выключить: он используется в зоне ${zones}`,
} as const;

export const ADMIN_TARIFF_LOG_MESSAGES = {
  CREATED: 'Tariff created',
  UPDATED: 'Tariff updated',
  STATUS_CHANGED: 'Tariff status changed',
} as const;
