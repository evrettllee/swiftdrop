import type { PluralForms } from '@/shared/lib/format';
import { ADMIN_ANALYTICS_TAB, type AdminAnalyticsTab } from './tabs';

export const ORDER_FORMS: PluralForms = { one: 'заказ', few: 'заказа', many: 'заказов' };
export const ORDER_DATIVE_FORMS: PluralForms = {
  one: 'заказу',
  few: 'заказам',
  many: 'заказам',
};
export const DELIVERED_ORDER_FORMS: PluralForms = {
  one: 'доставленный заказ',
  few: 'доставленных заказа',
  many: 'доставленных заказов',
};
export const DELIVERY_FORMS: PluralForms = {
  one: 'доставка',
  few: 'доставки',
  many: 'доставок',
};
export const OFFER_FORMS: PluralForms = {
  one: 'предложение',
  few: 'предложения',
  many: 'предложений',
};
export const DECLINE_GENITIVE_FORMS: PluralForms = {
  one: 'отказа',
  few: 'отказов',
  many: 'отказов',
};
export const CLIENT_FORMS: PluralForms = { one: 'клиент', few: 'клиента', many: 'клиентов' };
export const NEW_CLIENT_FORMS: PluralForms = {
  one: 'новый клиент',
  few: 'новых клиента',
  many: 'новых клиентов',
};
export const TICKET_FORMS: PluralForms = {
  one: 'обращение',
  few: 'обращения',
  many: 'обращений',
};
export const ERROR_FORMS: PluralForms = { one: 'ошибка', few: 'ошибки', many: 'ошибок' };
export const FAILURE_FORMS: PluralForms = { one: 'сбой', few: 'сбоя', many: 'сбоев' };
export const SERVICE_FORMS: PluralForms = { one: 'сервис', few: 'сервиса', many: 'сервисов' };

export const ADMIN_ANALYTICS_TAB_LABELS: Record<AdminAnalyticsTab, string> = {
  [ADMIN_ANALYTICS_TAB.BUSINESS]: 'Бизнес',
  [ADMIN_ANALYTICS_TAB.DELIVERY]: 'Доставка',
  [ADMIN_ANALYTICS_TAB.USERS]: 'Пользователи',
  [ADMIN_ANALYTICS_TAB.SUPPORT]: 'Поддержка',
  [ADMIN_ANALYTICS_TAB.SERVICE]: 'Сервис',
};

export const ADMIN_ANALYTICS_TEXTS = {
  TITLE: 'Аналитика',
  TABS_LABEL: 'Разделы аналитики',
  KPIS_LABEL: 'Ключевые показатели',
  LOAD_FAILED: 'Не удалось загрузить аналитику',
  TOO_MANY: 'Слишком много запросов, попробуйте через минуту',
  NO_DATA: 'Нет данных',
  EMPTY_CELL: '-',
  TO_LAST_WEEK: 'к прошлой неделе',
  TO_PREVIOUS_PERIOD: 'к прошлому периоду',
  was: (value: string): string => `было ${value}`,
  ofTotal: (part: string, total: string): string => `${part} из ${total}`,
} as const;
