import {
  SUPPORT_AUTHOR_ROLE,
  SUPPORT_SORT,
  SUPPORT_VIEW,
  type SupportAuthorRole,
  type SupportSort,
  type SupportView,
} from '@/shared/support-api';
import { PERIOD_PRESET, type PeriodPreset } from '@/shared/lib/calendar';
import { formatCount, pluralize } from '@/shared/lib/format';
import { MANAGER_SEARCH_TEXT_MIN_LENGTH } from '@/shared/staff-api';

export const MANAGER_SUPPORT_TEXTS = {
  TITLE: 'Поддержка',
  TABS: 'Обращения',
  SEARCH_LABEL: 'Поиск обращений',
  SEARCH_PLACEHOLDER: 'Номер обращения или заказа, имя, телефон',
  SEARCH_PLACEHOLDER_SHORT: 'Номер, имя или телефон',
  SEARCH_CLEAR: 'Очистить поиск',
  SEARCH_TOO_SHORT: `Введите не меньше ${MANAGER_SEARCH_TEXT_MIN_LENGTH} символов`,
  ROLES: 'Автор обращения',
  ALL: 'Все',
  SORT: 'Сортировка',
  LIST: 'Очередь обращений',
  LOAD_FAILED: 'Не удалось загрузить обращения',
  RETRY: 'Повторить',
  QUEUE_EMPTY_TITLE: 'Все обращения отвечены',
  QUEUE_EMPTY_TEXT: 'Новые обращения появятся здесь.',
  TAB_EMPTY_TITLE: 'Обращений нет',
  TAB_EMPTY_TEXT: 'Здесь появятся обращения этой группы.',
  NOTHING_TITLE: 'Ничего не найдено',
  SELECT_TITLE: 'Выберите обращение',
  SELECT_TEXT: 'Переписка откроется здесь.',
  waiting: (minutes: number) => `ждёт ${minutes} мин`,
  waitingShort: (minutes: number) => `${minutes} мин`,
} as const;

export const VIEW_LABELS: Record<SupportView, string> = {
  [SUPPORT_VIEW.AWAITING]: 'Без ответа',
  [SUPPORT_VIEW.OPEN]: 'Открытые',
  [SUPPORT_VIEW.CLOSED]: 'Закрытые',
};

export const ROLE_CHIPS: Record<SupportAuthorRole, string> = {
  [SUPPORT_AUTHOR_ROLE.CLIENT]: 'Клиенты',
  [SUPPORT_AUTHOR_ROLE.COURIER]: 'Курьеры',
};

export const ROLE_TAGS: Record<SupportAuthorRole, string> = {
  [SUPPORT_AUTHOR_ROLE.CLIENT]: 'Клиент',
  [SUPPORT_AUTHOR_ROLE.COURIER]: 'Курьер',
};

export const ROLE_NAMES: Record<SupportAuthorRole, string> = {
  [SUPPORT_AUTHOR_ROLE.CLIENT]: 'клиент',
  [SUPPORT_AUTHOR_ROLE.COURIER]: 'курьер',
};

export const SORT_LABELS: Record<SupportSort, string> = {
  [SUPPORT_SORT.LONGEST_WAITING]: 'Дольше без ответа',
  [SUPPORT_SORT.NEWEST]: 'Недавние сообщения',
  [SUPPORT_SORT.NEWEST_CREATED]: 'Новые обращения',
  [SUPPORT_SORT.OLDEST_CREATED]: 'Старые обращения',
};

export const EMPTY_TEXTS = {
  byNumber: (query: string) => `По номеру «${query}»`,
  byText: (query: string) => `По запросу «${query}»`,
  BY_FILTERS: 'По выбранным фильтрам',
  NONE: ' обращений нет.',
  CHECK_NUMBER: ' Проверьте номер или измените фильтры.',
  CHECK_TEXT: ' Проверьте запрос или измените фильтры.',
  CHANGE_FILTERS: ' Измените фильтры.',
} as const;

export const FILTER_TEXTS = {
  FILTERS: 'Фильтры',
  TOPIC: 'Тема',
  PERIOD: 'Дата создания',
  PERIOD_CHIP: 'Создано',
  PERIOD_FROM: 'С',
  PERIOD_TO: 'По',
  PERIOD_INVALID: 'Начало периода позже его конца',
  APPLY: 'Показать обращения',
  COUNT_DELAY_MS: 300,
  showTickets: (count: number) =>
    `Показать ${formatCount(count)} ${pluralize(count, { one: 'обращение', few: 'обращения', many: 'обращений' })}`,
  RESET: 'Сбросить',
  APPLIED: 'Применённые фильтры',
  RESET_ALL: 'Сбросить всё',
  SEPARATOR: ', ',
  removeFilter: (name: string, value: string) => `Убрать фильтр ${name} ${value}`,
  periodDays: (days: number) =>
    `${formatCount(days)} ${pluralize(days, { one: 'день', few: 'дня', many: 'дней' })}`,
  periodFrom: (date: string) => `с ${date}`,
  periodTo: (date: string) => `по ${date}`,
  periodRange: (from: string, to: string) => `${from}–${to}`,
} as const;

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  [PERIOD_PRESET.ALL]: 'Всё время',
  [PERIOD_PRESET.WEEK]: 'Последние 7 дней',
  [PERIOD_PRESET.MONTH]: 'Последние 30 дней',
  [PERIOD_PRESET.CUSTOM]: 'Свой период',
};
