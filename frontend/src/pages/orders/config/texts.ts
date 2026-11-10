import { UI_TEXTS } from '@/shared/config';
import { PERIOD_PRESET, type PeriodPreset } from '@/shared/lib/calendar';
import { formatCount, pluralize } from '@/shared/lib/format';
import { ORDERS_SORT, ORDERS_TAB, type OrdersSort, type OrdersTab } from './list';

const ORDER_FORMS = { one: 'заказ', few: 'заказа', many: 'заказов' };
const DAY_FORMS = { one: 'день', few: 'дня', many: 'дней' };

export const ORDERS_TEXTS = {
  PAGE_TITLE: 'Мои заказы',
  NEW_ORDER: UI_TEXTS.NEW_ORDER,
  TABS_LABEL: 'Группы заказов',
  LIST_FAILED: 'Не удалось загрузить заказы. Попробуйте ещё раз',
  LIST_FAILED_TITLE: 'Не удалось загрузить заказы',
  LIST_LOADING: 'Загрузка заказов',
  RETRY: UI_TEXTS.RETRY,
  SHOW_MORE: 'Показать ещё',
  shown: (shown: number, total: number) => `Показано ${shown} из ${total}`,
  COURIER_NOT_ASSIGNED: 'Не назначен',
  SEARCH_LABEL: 'Поиск заказов',
  SEARCH_PLACEHOLDER: 'Номер заказа или улица',
  SEARCH_PLACEHOLDER_SHORT: 'Номер или улица',
  SEARCH_CLEAR: 'Очистить поиск',
  SORT: 'Сортировка',
  APPLIED_FILTERS: 'Применённые фильтры',
  RESET_ALL: 'Сбросить всё',
  RESET: 'Сбросить',
  SHOW_ORDERS: 'Показать заказы',
  showOrders: (count: number) => `Показать ${formatCount(count)} ${pluralize(count, ORDER_FORMS)}`,
  removeFilter: (name: string, value: string) => `Убрать фильтр ${name} ${value}`,
} as const;

export const FILTER_TEXTS = {
  PERIOD: 'Период',
  PERIOD_FROM: 'С',
  PERIOD_TO: 'По',
  PERIOD_INVALID: 'Начало периода позже его конца',
  SEARCH: 'Поиск',
  periodDays: (days: number) => `${formatCount(days)} ${pluralize(days, DAY_FORMS)}`,
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

export const SORT_LABELS: Record<OrdersSort, string> = {
  [ORDERS_SORT.NEWEST]: 'Сначала новые',
  [ORDERS_SORT.OLDEST]: 'Сначала старые',
  [ORDERS_SORT.PRICE_HIGH]: 'Сначала дороже',
  [ORDERS_SORT.PRICE_LOW]: 'Сначала дешевле',
};

export const SHORT_SORT_LABELS: Record<OrdersSort, string> = {
  [ORDERS_SORT.NEWEST]: 'Новые',
  [ORDERS_SORT.OLDEST]: 'Старые',
  [ORDERS_SORT.PRICE_HIGH]: 'Дороже',
  [ORDERS_SORT.PRICE_LOW]: 'Дешевле',
};

export const ORDER_TAB_LABELS: Record<OrdersTab, string> = {
  [ORDERS_TAB.ACTIVE]: 'Активные',
  [ORDERS_TAB.FINISHED]: 'Завершённые',
  [ORDERS_TAB.CANCELLED]: 'Отменённые',
  [ORDERS_TAB.ALL]: 'Все',
};

export const NO_ORDERS_TEXTS = {
  title: 'Заказов пока нет',
  text: 'Укажите адреса и посылку, и мы сразу посчитаем стоимость доставки.',
} as const;

export const NOT_FOUND_TEXTS = {
  title: 'Ничего не найдено',
  text: 'Измените поиск или период либо сбросьте фильтры.',
} as const;

export const EMPTY_TAB_TEXTS: Record<OrdersTab, { title: string; text: string }> = {
  [ORDERS_TAB.ACTIVE]: {
    title: 'Активных заказов нет',
    text: 'Здесь появятся заказы, которые ещё в работе.',
  },
  [ORDERS_TAB.FINISHED]: {
    title: 'Завершённых заказов нет',
    text: 'Здесь появятся доставленные заказы.',
  },
  [ORDERS_TAB.CANCELLED]: {
    title: 'Отменённых заказов нет',
    text: 'Здесь появятся отменённые заказы.',
  },
  [ORDERS_TAB.ALL]: NO_ORDERS_TEXTS,
};
