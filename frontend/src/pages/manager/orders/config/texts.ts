import {
  EXPORT_FORMAT,
  MANAGER_ORDERS_SORT,
  MANAGER_SEARCH_TEXT_MIN_LENGTH,
  PAYMENT_STATE,
  type ExportFormat,
  type ManagerOrdersSort,
  type PaymentState,
} from '@/shared/staff-api';
import { UI_TEXTS } from '@/shared/config';
import { formatCount, pluralize } from '@/shared/lib/format';
import { PERIOD_PRESET, type PeriodPreset } from '@/shared/lib/calendar';
import { ORDERS_TAB, type OrdersTab } from './list';

const ORDER_FORMS = { one: 'заказ', few: 'заказа', many: 'заказов' };

export const MANAGER_ORDERS_TEXTS = {
  TITLE: UI_TEXTS.ORDERS,
  EXPORT: 'Выгрузить',
  TABS_LABEL: 'Группы заказов',
  SEARCH_LABEL: 'Поиск заказов',
  SEARCH_PLACEHOLDER: 'Номер, телефон, имя или email',
  SEARCH_PLACEHOLDER_SHORT: 'Номер, телефон или имя',
  SEARCH_CLEAR: 'Очистить поиск',
  SEARCH_TOO_SHORT: `Введите не меньше ${MANAGER_SEARCH_TEXT_MIN_LENGTH} символов`,
  FILTERS: 'Фильтры',
  FILTERS_PANEL: 'Фильтры заказов',
  FILTERS_SHEET: 'Фильтры и сортировка',
  SORT: 'Сортировка',
  APPLIED_FILTERS: 'Применённые фильтры',
  RESET_ALL: 'Сбросить всё',
  RESET: 'Сбросить',
  SHOW_ORDERS: 'Показать заказы',
  showOrders: (count: number) => `Показать ${formatCount(count)} ${pluralize(count, ORDER_FORMS)}`,
  newOrders: (count: number) =>
    `${pluralize(count, { one: 'Появился', few: 'Появилось', many: 'Появилось' })} ${formatCount(count)} ${pluralize(count, { one: 'новый заказ', few: 'новых заказа', many: 'новых заказов' })}`,
  SHOW_NEW: 'Показать',
  TABLE_LABEL: 'Заказы',
  COLUMN_ORDER: 'Заказ',
  COLUMN_CLIENT: 'Клиент',
  COLUMN_ROUTE: 'Маршрут',
  COLUMN_COURIER: 'Курьер',
  COLUMN_STATUS: 'Статус',
  COLUMN_WAITING: 'Ждёт назначения',
  COLUMN_SUM: 'Сумма',
  COLUMN_ACTIONS: 'Действия',
  ROUTE_TO: 'в',
  NOT_ASSIGNED: 'Не назначен',
  courierLine: (name: string | null) => `Курьер: ${name ?? 'не назначен'}`,
  waiting: (minutes: number) => `${formatCount(minutes)} мин`,
  waitingLong: (minutes: number) => `Ждёт ${formatCount(minutes)} мин`,
  actions: (orderNumber: string) => `Действия с заказом ${orderNumber}`,
  OPEN_ORDER: 'Открыть заказ',
  ASSIGN: 'Назначить',
  ASSIGN_COURIER: 'Назначить курьера',
  CANCEL_ORDER: 'Отменить заказ',
  PAGE_SIZE: 'Показывать по',
  SHOW_MORE: 'Показать ещё',
  shown: (shown: number, total: number) =>
    `Показано ${formatCount(shown)} из ${formatCount(total)}`,
  LIST_FAILED_TITLE: 'Не удалось загрузить заказы',
  LIST_FAILED: 'Не удалось загрузить заказы. Попробуйте ещё раз',
  RETRY: UI_TEXTS.RETRY,
  EMPTY_TITLE: 'Ничего не найдено',
  EMPTY_TAB_TITLE: 'Заказов нет',
  EMPTY_TAB_TEXT: 'Здесь появятся заказы этой группы.',
  removeFilter: (name: string, value: string) => `Убрать фильтр ${name} ${value}`,
} as const;

export const FILTER_TEXTS = {
  PERIOD: 'Период',
  PERIOD_FROM: 'С',
  PERIOD_TO: 'По',
  PERIOD_INVALID: 'Начало периода позже его конца',
  COURIER: 'Курьер',
  COURIER_PLACEHOLDER: 'Любой курьер',
  COURIER_CLEAR: 'Убрать курьера',
  COURIER_NOT_FOUND: 'Курьер не найден',
  COURIER_FAILED: 'Не удалось найти курьеров',
  courierFallback: (courierId: number) => `Курьер №${courierId}`,
  PAYMENT: 'Оплата',
  PARCEL: 'Посылка',
  FRAGILE_ONLY: 'Только хрупкие',
  FRAGILE_CHIP: 'только хрупкие',
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

export const PAYMENT_LABELS: Record<PaymentState, string> = {
  [PAYMENT_STATE.PAID]: 'Оплачен',
  [PAYMENT_STATE.REFUNDED]: 'Деньги возвращены',
  [PAYMENT_STATE.UNPAID]: 'Не оплачен',
};

export const SORT_LABELS: Record<ManagerOrdersSort, string> = {
  [MANAGER_ORDERS_SORT.NEWEST]: 'Сначала новые',
  [MANAGER_ORDERS_SORT.OLDEST]: 'Сначала старые',
  [MANAGER_ORDERS_SORT.PRICE_HIGH]: 'Сначала дороже',
  [MANAGER_ORDERS_SORT.PRICE_LOW]: 'Сначала дешевле',
  [MANAGER_ORDERS_SORT.LONGEST_WAITING]: 'Дольше всего ждёт',
};

export const TAB_LABELS: Record<OrdersTab, string> = {
  [ORDERS_TAB.ATTENTION]: 'Требуют внимания',
  [ORDERS_TAB.ACTIVE]: 'Активные',
  [ORDERS_TAB.AWAITING_PAYMENT]: 'Ждут оплаты',
  [ORDERS_TAB.FINISHED]: 'Завершённые',
  [ORDERS_TAB.CANCELLED]: 'Отменённые',
  [ORDERS_TAB.ALL]: 'Все',
};

export const EMPTY_TEXTS = {
  byNumber: (query: string) => `По номеру «${query}»`,
  byText: (query: string) => `По запросу «${query}»`,
  BY_FILTERS: 'По выбранным фильтрам',
  periodLast: (days: number) => ` за последние ${FILTER_TEXTS.periodDays(days)}`,
  PERIOD_CUSTOM: ' за выбранный период',
  NONE: ' заказов нет.',
  CHECK_NUMBER: ' Проверьте номер или измените фильтры.',
  CHECK_TEXT: ' Проверьте запрос или измените фильтры.',
  CHANGE_FILTERS: ' Измените фильтры.',
} as const;

export const EXPORT_TEXTS = {
  TITLE: 'Выгрузить заказы',
  count: (count: number) => `${formatCount(count)} ${pluralize(count, ORDER_FORMS)}`,
  scope: (parts: readonly string[]) => `По текущим фильтрам: ${parts.join(', ')}`,
  FORMAT: 'Формат',
  WITH_PHONES: 'Добавить телефоны клиентов и курьеров',
  CANCEL: 'Отмена',
  SUBMIT: 'Выгрузить',
  tooLarge: (total: number) =>
    `Выгрузка ограничена 5000 строками, сузьте фильтр. Сейчас под фильтр попадает ${formatCount(total)} ${pluralize(total, ORDER_FORMS)}`,
  TOO_MANY: 'Слишком много выгрузок, попробуйте через минуту',
  FAILED: 'Не удалось выгрузить заказы. Попробуйте ещё раз',
  FAILED_TITLE: 'Выгрузка не удалась',
} as const;

export const EXPORT_FORMAT_TEXTS: Record<ExportFormat, { title: string; description: string }> = {
  [EXPORT_FORMAT.XLSX]: { title: 'Excel (.xlsx)', description: 'Для Excel и Google Таблиц' },
  [EXPORT_FORMAT.CSV]: { title: 'CSV', description: 'Для импорта в другие программы' },
};
