import type { PluralForms } from '@/shared/lib/format';

export const ORDER_FORMS: PluralForms = { one: 'заказ', few: 'заказа', many: 'заказов' };
export const DELIVERY_FORMS: PluralForms = { one: 'доставка', few: 'доставки', many: 'доставок' };
export const HOUR_FORMS: PluralForms = { one: 'час', few: 'часа', many: 'часов' };

export const MANAGER_ANALYTICS_TEXTS = {
  TITLE: 'Аналитика',
  COURIERS_TITLE: 'Курьеры',
  BREADCRUMBS: 'Навигация по разделу',
  KPIS: 'Ключевые показатели',
  LOAD_FAILED: 'Не удалось загрузить аналитику',
  COURIERS_FAILED: 'Не удалось загрузить курьеров',
  TOO_MANY: 'Слишком много запросов, попробуйте через минуту',
  RETRY: 'Повторить',
  ALL_COURIERS: 'Все курьеры',
  NO_COURIERS: 'За период курьеры не работали',
  EMPTY: '—',
  periodLine: (current: string, previous: string) => `${current}, сравнение с ${previous}`,
} as const;

export const PERIOD_TEXTS = {
  LABEL: 'Период',
  WEEK: '7 дней',
  MONTH: '30 дней',
  QUARTER: '90 дней',
  CUSTOM: 'Свой период',
  FROM: 'С',
  TO: 'По',
  REQUIRED: 'Укажите обе даты периода',
  REVERSED: 'Начало периода позже его конца',
  TOO_LONG: 'Период — не больше 92 дней',
} as const;

export const KPI_TEXTS = {
  DELIVERED: 'Доставлено',
  ON_TIME: 'Вовремя',
  DELIVERY_TIME: 'Среднее время доставки',
  DELIVERY_TIME_SHORT: 'Время доставки',
  CANCELLED: 'Отменено',
  REVENUE: 'Выручка',
  SEARCH: 'Поиск курьера',
  NO_PREVIOUS: 'нет данных за прошлый период',
  TO_PREVIOUS: 'к прошлому периоду',
  BY_CLIENT: 'клиентом',
  BY_SYSTEM: 'системой',
  BY_STAFF: 'сотрудником',
  minutes: (value: string) => `${value} мин`,
  seconds: (value: string) => `${value} с`,
  deliveredOf: (total: string) => `из ${total} оформленных`,
  deliveredOfShort: (total: string) => `из ${total}`,
  onTime: (count: string, orders: string) => `${count} ${orders} к обещанному времени или раньше`,
  onTimeShort: (count: string) => `${count} к обещанному`,
  deliveryTime: 'от оплаты до вручения',
  was: (value: string) => `было ${value}`,
  cancelledCount: (count: string, orders: string) => `${count} ${orders}`,
  avgCheck: (value: string) => `средний чек ${value}, без возвратов`,
  avgCheckShort: (value: string) => `чек ${value}`,
  search: (manual: string, orders: string) => `в среднем, вручную назначено ${manual} ${orders}`,
  searchShort: 'мин:с',
  manualShort: (share: string) => `вручную ${share}`,
} as const;

export const CHART_TEXTS = {
  DAYS: 'Заказы по дням',
  HOURS: 'Нагрузка по часам',
  HOURS_NOTE: 'Заказов в час в среднем за период',
  DELIVERED: 'Доставлены',
  CANCELLED: 'Отменены',
  IN_PROGRESS: 'В работе',
  NO_HOURS: 'заказов не было',
  delivered: (count: string) => `доставлено ${count}`,
  cancelled: (count: string) => `отменено ${count}`,
  inProgress: (count: string) => `в работе ${count}`,
  hourAt: (hour: number, word: string) => `в ${hour} ${word}`,
  hourOf: (hour: number) => `${hour}:00`,
  perHour: (value: string, orders: string) => `${value} ${orders} в час`,
  peak: (at: string, value: string) => `пик ${at}, ${value}`,
  least: (at: string, value: string) => `меньше всего ${at}, ${value}`,
  summary: (title: string, text: string) => `${title}: ${text}`,
} as const;

export const COURIER_TEXTS = {
  TABLE: 'Курьеры за период',
  COURIER: 'Курьер',
  DELIVERED: 'Доставок',
  ON_TIME: 'Вовремя',
  AVG_TIME: 'Среднее время',
  DECLINED: 'Отказы от предложений',
  HOURS: 'Часов на линии',
  SORT: 'Сортировка',
  ON_TIME_SHORT: 'Вовремя',
  AVG_SHORT: 'В среднем',
  DECLINED_SHORT: 'Отказы',
  HOURS_SHORT: 'На линии',
  hours: (value: string) => `${value} ч`,
  sortBy: (column: string) => `Сортировать: ${column}`,
} as const;

export const SORT_LABELS = {
  'delivered:desc': 'Больше доставок',
  'delivered:asc': 'Меньше доставок',
  'onTimePct:desc': 'Чаще вовремя',
  'onTimePct:asc': 'Реже вовремя',
  'avgDeliveryMin:asc': 'Быстрее доставка',
  'avgDeliveryMin:desc': 'Дольше доставка',
  'declinedOffers:desc': 'Больше отказов',
  'declinedOffers:asc': 'Меньше отказов',
  'hoursOnline:desc': 'Дольше на линии',
  'hoursOnline:asc': 'Меньше на линии',
  'name:asc': 'Имя от А до Я',
  'name:desc': 'Имя от Я до А',
} as const;
