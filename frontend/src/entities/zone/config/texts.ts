import { ZONE_NAME_MAX_LENGTH, ZONE_PRIORITY } from '@/shared/staff-api';

export const ZONE_ERROR_TEXTS = {
  NAME_INVALID: `Название: от 1 до ${ZONE_NAME_MAX_LENGTH} символов`,
  PRIORITY_INVALID: `Приоритет: целое число от ${ZONE_PRIORITY.MIN} до ${ZONE_PRIORITY.MAX}`,
  ZONE_CHANGED: 'Зону уже изменили. Обновите, чтобы увидеть новые данные',
  NAME_TAKEN: 'Зона с таким названием уже есть',
  LAST_ACTIVE: 'Нельзя выключить последнюю активную зону: без неё нельзя оформить заказ',
  TARIFF_NOT_FOUND: 'Тариф не найден',
  BUSY: 'Зоны сейчас меняет другой сотрудник. Попробуйте ещё раз',
  FAILED: 'Не удалось сохранить зону',
  FAILED_TEXT: 'Проверьте соединение и попробуйте ещё раз.',
} as const;

export const POLYGON_ERROR_TEXTS = {
  too_few_points: 'В зоне должно быть не меньше 3 разных точек',
  too_many_points: 'В зоне может быть не больше 200 точек',
  self_intersection: 'Граница зоны пересекает или касается сама себя',
  too_small: 'Зона слишком маленькая: нужно не меньше 0,01 км²',
  out_of_range: 'Широта должна быть от -90 до 90, долгота — от -180 до 180',
} as const;

export const OVERLAP_TEXTS = {
  title: (name: string) => `Пересекается с зоной «${name}»`,
  priority: (name: string, priority: number) => `Приоритет зоны «${name}» — ${priority}`,
  NEW_WINS: ', поэтому внутри пересечения будет действовать новая зона.',
  SELF_WINS: ', поэтому внутри пересечения будет действовать эта зона.',
  otherWins: (name: string) => `, поэтому внутри пересечения будет действовать зона «${name}».`,
  EQUAL: ' При равном приоритете действует более старая зона.',
} as const;
