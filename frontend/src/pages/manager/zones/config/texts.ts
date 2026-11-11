import { UI_TEXTS } from '@/shared/config';

export const MANAGER_ZONES_TEXTS = {
  TITLE: 'Зоны обслуживания',
  TITLE_SHORT: 'Зоны',
  NEW_ZONE: 'Новая зона',
  SEARCH_LABEL: 'Поиск зоны',
  SEARCH_PLACEHOLDER: 'Название зоны',
  SEARCH_CLEAR: 'Очистить поиск',
  SHOW_DISABLED: 'Показывать выключенные',
  MAP_LABEL: 'Карта зон обслуживания',
  TABLE_LABEL: 'Зоны обслуживания',
  LIST_LABEL: 'Зоны обслуживания',
  LOAD_FAILED_TITLE: 'Не удалось загрузить зоны',
  LOAD_FAILED: 'Проверьте соединение и попробуйте ещё раз.',
  RETRY: UI_TEXTS.RETRY,
  EMPTY_TITLE: 'Зон пока нет',
  EMPTY_TEXT: 'Создайте первую зону, чтобы принимать заказы.',
  NOTHING_TITLE: 'Ничего не найдено',
  bySearch: (query: string) => `По запросу «${query}» зон нет.`,
  NO_ACTIVE_SHOWN: 'Включённых зон нет. Включите «Показывать выключенные».',
  shown: (from: number, to: number, total: number) => `${from}–${to} из ${total}`,
} as const;

export const COLUMN_TEXTS = {
  ZONE: 'Зона',
  TARIFF: 'Тариф',
  PRIORITY: 'Приоритет',
  AREA: 'Площадь',
  UPDATED: 'Изменена',
  STATUS: 'Статус',
  ACTIONS: 'Действия',
} as const;

export const ZONE_ROW_TEXTS = {
  ON: 'Включена',
  OFF: 'Выключена',
  edit: (name: string) => `Изменить зону ${name}`,
  select: (name: string) => `Показать зону ${name} на карте`,
  switchLabel: (name: string) => `Зона ${name} включена`,
  tariff: (name: string) => `Тариф: ${name}`,
  facts: (priority: number, area: string, date: string) =>
    `Приоритет ${priority}, ${area}, изменена ${date}`,
  area: (value: string) => `${value} км²`,
} as const;

export const TOGGLE_TEXTS = {
  CONFIRM_TITLE: (name: string) => `Выключить зону «${name}»?`,
  CONFIRM_TEXT: 'Выключенная зона не принимает новые заказы.',
  CONFIRM: 'Выключить',
  KEEP: 'Не выключать',
  TURNED_ON: 'Зона включена',
  TURNED_OFF: 'Зона выключена',
  CHANGED: 'Зону уже изменили',
  CHANGED_TEXT: 'Список обновлён, попробуйте ещё раз.',
  FAILED: 'Не удалось изменить зону',
  FAILED_TEXT: 'Проверьте соединение и попробуйте ещё раз.',
} as const;

export const EDIT_TEXTS = {
  title: (name: string) => `Изменить зону «${name}»`,
  TITLE_SHORT: 'Изменить зону',
  NAME: 'Название',
  TARIFF: 'Тариф',
  PRIORITY: 'Приоритет',
  PRIORITY_HINT: 'Где зоны пересекаются, действует зона с большим приоритетом.',
  CONTOUR: 'Изменить границу на карте',
  ACTIVE: 'Зона включена',
  ACTIVE_HINT: 'Выключенная зона не принимает новые заказы',
  ON: 'Вкл',
  OFF: 'Выкл',
  SAVE: 'Сохранить',
  CANCEL: 'Отмена',
  SAVED: 'Зона сохранена',
  LOADING: 'Загружаем зону',
  NOT_FOUND: 'Зона не найдена',
  NOT_FOUND_TEXT: 'Возможно, её удалили. Закройте окно и обновите список.',
  LOAD_FAILED: 'Не удалось загрузить зону',
  RETRY: UI_TEXTS.RETRY,
  REFRESH: 'Обновить',
  CHANGED_ELSEWHERE: 'Зону изменили в другом окне',
} as const;

export const DISCARD_TEXTS = {
  TITLE: 'Отменить изменения?',
  TEXT: 'Несохранённые изменения пропадут.',
  CONFIRM: 'Отменить изменения',
  KEEP: 'Продолжить правку',
} as const;
