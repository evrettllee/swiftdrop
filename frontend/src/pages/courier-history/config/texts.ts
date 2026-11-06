import { UI_TEXTS } from '@/shared/config';
import { CALENDAR_PERIOD, type CalendarPeriod } from '@/shared/lib/calendar';
import { formatCount, pluralize } from '@/shared/lib/format';
import { HISTORY_SORT, HISTORY_STATUS, type HistorySort, type HistoryStatus } from './list';

const ORDER_FORMS = { one: 'заказ', few: 'заказа', many: 'заказов' };

export const HISTORY_TEXTS = {
  PAGE_TITLE: UI_TEXTS.COURIER_HISTORY,
  LIST_LABEL: 'Завершённые заказы',
  LIST_LOADING: 'Загрузка истории',
  LOAD_ERROR: 'Не удалось загрузить историю',
  RETRY: UI_TEXTS.RETRY,
  SHOW_MORE: 'Показать ещё',
  NO_DATE: '—',
  EMPTY_TITLE: 'Доставок пока нет',
  EMPTY_TEXT: 'Здесь появятся заказы, которые вы доставили.',
  EMPTY_PERIOD_TITLE: 'За этот период доставок нет',
  EMPTY_PERIOD_TEXT: 'Выберите другой период.',
  EMPTY_CANCELLED_TITLE: 'За этот период отменённых заказов нет',
  NOT_FOUND_TITLE: 'Заказ не найден',
  NOT_FOUND_TEXT: 'Проверьте номер заказа или выберите другой период.',
  TO_WORK: 'К работе',
  SEARCH_LABEL: 'Поиск по номеру заказа',
  SEARCH_PLACEHOLDER: 'Номер заказа',
  SEARCH_CLEAR: 'Очистить поиск',
  SEARCH_NOT_NUMBER: 'Введите номер заказа цифрами',
  SORT: 'Сортировка',
  APPLIED_FILTERS: 'Применённые фильтры',
  RESET_ALL: 'Сбросить всё',
  RESET: 'Сбросить',
  SHOW_ORDERS: 'Показать заказы',
  showOrders: (count: number) => `Показать ${formatCount(count)} ${pluralize(count, ORDER_FORMS)}`,
  removeFilter: (name: string, value: string) => `Убрать фильтр ${name} ${value}`,
  shown: (shown: number, total: number) => `Показано ${shown} из ${total}`,
  details: (distance: string, weight: string) => `${distance}, ${weight}`,
} as const;

export const FILTER_TEXTS = {
  PERIOD: 'Период',
  PANEL: 'Период и статус',
  STATUS: 'Статус',
  ALL_STATUSES: 'Все',
  PERIOD_FROM: 'С',
  PERIOD_TO: 'По',
  PERIOD_INVALID: 'Начало периода позже его конца',
  SEARCH: 'Номер',
  periodFrom: (date: string) => `с ${date}`,
  periodTo: (date: string) => `по ${date}`,
  periodRange: (from: string, to: string) => `${from}–${to}`,
} as const;

export const PERIOD_LABELS: Record<CalendarPeriod, string> = {
  [CALENDAR_PERIOD.THIS_WEEK]: 'Эта неделя',
  [CALENDAR_PERIOD.LAST_WEEK]: 'Прошлая неделя',
  [CALENDAR_PERIOD.THIS_MONTH]: 'Этот месяц',
  [CALENDAR_PERIOD.ALL]: 'Всё время',
  [CALENDAR_PERIOD.CUSTOM]: 'Свой период',
};

export const SORT_LABELS: Record<HistorySort, string> = {
  [HISTORY_SORT.NEWEST]: 'Сначала новые',
  [HISTORY_SORT.OLDEST]: 'Сначала старые',
  [HISTORY_SORT.FARTHEST]: 'Сначала дальние',
  [HISTORY_SORT.NEAREST]: 'Сначала ближние',
};

export const HISTORY_SUMMARY_TEXTS = {
  ALL_TIME: 'Всего',
  DELIVERY_FORMS: { one: 'доставка', few: 'доставки', many: 'доставок' },
  since: (day: string) => `С ${day}`,
  until: (day: string) => `По ${day}`,
  lead: (period: string) => `${period}: `,
} as const;

export const STATUS_LABELS: Record<HistoryStatus, string> = {
  [HISTORY_STATUS.DELIVERED]: 'Доставленные',
  [HISTORY_STATUS.CANCELLED]: 'Отменённые',
};
