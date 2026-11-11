export const MANAGER_ZONES_ROUTES = {
  BASE: 'manager',
  ZONES: 'zones',
  ZONE: 'zones/:zoneId',
  TARIFFS: 'tariffs',
} as const;

export const ZONE_PRIORITY = { MIN: 0, MAX: 100 } as const;
export const ZONE_RING_MAX_RAW_POINTS = 1000;
export const ZONE_AREA_DECIMALS = 2;
export const ZONES_WRITE_LOCK_KEY = 282_001;

export const ZONE_ERROR_CODE = {
  ZONE_CHANGED: 'ZONE_CHANGED',
  ZONE_NAME_TAKEN: 'ZONE_NAME_TAKEN',
  TARIFF_NOT_FOUND: 'TARIFF_NOT_FOUND',
  LAST_ACTIVE_ZONE: 'LAST_ACTIVE_ZONE',
  INVALID_POLYGON: 'INVALID_POLYGON',
} as const;

export const MANAGER_ZONES_MESSAGES = {
  ZONE_NOT_FOUND: 'Зона не найдена',
  ZONE_ID_INVALID: 'Некорректный номер зоны',
  ZONE_CHANGED: 'Зону уже изменили. Обновите её и повторите правку',
  ZONE_NAME_TAKEN: 'Зона с таким названием уже есть',
  TARIFF_NOT_FOUND: 'Тариф не найден',
  LAST_ACTIVE_ZONE: 'Нельзя выключить последнюю активную зону: без неё нельзя оформить заказ',
  NAME_INVALID: 'Название: от 1 до 80 символов',
  PRIORITY_INVALID: 'Приоритет: целое число от 0 до 100',
  TARIFF_ID_INVALID: 'Некорректный номер тарифа',
  ACTIVE_INVALID: 'isActive: true или false',
  POLYGON_SHAPE_INVALID: 'Полигон: одно кольцо из точек [долгота, широта]',
  EXPECTED_UPDATED_AT_INVALID: 'Укажите expectedUpdatedAt: время зоны из последнего ответа',
  NOTHING_TO_CHANGE: 'Укажите хотя бы одно поле для изменения',
  BUSY: 'Зоны сейчас меняет другой сотрудник. Попробуйте ещё раз',
} as const;

export const ZONE_POLYGON_MESSAGES = {
  too_few_points: 'В зоне должно быть не меньше 3 разных точек',
  too_many_points: 'В зоне может быть не больше 200 точек',
  self_intersection: 'Граница зоны пересекает или касается сама себя',
  too_small: 'Зона слишком маленькая: нужно не меньше 0,01 км²',
  out_of_range: 'Широта должна быть от -90 до 90, долгота — от -180 до 180',
} as const;
