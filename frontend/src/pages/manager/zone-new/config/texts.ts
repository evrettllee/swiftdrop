import { ZONE_PRIORITY } from '@/shared/staff-api';

export const MANAGER_ZONE_NEW_TEXTS = {
  TITLE: 'Новая зона',
  NAV_LABEL: 'Навигация',
  PARENT: 'Зоны',
  PANEL: 'Параметры зоны',
  NAME: 'Название',
  TARIFF: 'Тариф',
  PRIORITY: 'Приоритет',
  PRIORITY_HINT: 'Где зоны пересекаются, действует зона с большим приоритетом.',
  ACTIVE: 'Зона включена',
  SAVE: 'Сохранить зону',
  CANCEL: 'Отмена',
  CREATED: 'Зона создана',
} as const;

export const DEFAULT_PRIORITY = String(ZONE_PRIORITY.MIN);
