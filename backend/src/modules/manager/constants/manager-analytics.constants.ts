import { SORT_DIRECTION } from '@/common/constants/list.constants';
import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import type { UserThrottleOptions } from '@/common/guards/user-throttle.guard';

export const MANAGER_ANALYTICS_ROUTES = {
  BASE: 'manager/analytics',
  SUMMARY: 'summary',
  COURIERS: 'couriers',
} as const;

export const ANALYTICS_PERIOD = {
  DEFAULT_DAYS: 7,
  MAX_DAYS: 92,
} as const;

export const ANALYTICS_COURIERS_PAGE_SIZE_DEFAULT = 20;
export const ANALYTICS_HOURS_PER_DAY = 24;
export const ANALYTICS_OPEN_SHIFT_TAIL = '2 minutes';

export const ANALYTICS_DECIMALS = {
  PERCENT: 1,
  MINUTES: 1,
  HOURS_ONLINE: 1,
  ORDERS_PER_HOUR: 2,
} as const;

export const ANALYTICS_COURIER_SORT_KEYS = [
  'delivered',
  'onTimePct',
  'avgDeliveryMin',
  'declinedOffers',
  'hoursOnline',
  'name',
] as const;

export type AnalyticsCourierSortKey = (typeof ANALYTICS_COURIER_SORT_KEYS)[number];

export const ANALYTICS_COURIER_DEFAULT_SORT = {
  key: 'delivered',
  direction: SORT_DIRECTION.DESC,
} as const;

export const ANALYTICS_VALIDATION_MESSAGES = {
  PERIOD_TOO_LONG: `Период аналитики: не больше ${ANALYTICS_PERIOD.MAX_DAYS} дней`,
} as const;

export const MANAGER_ANALYTICS_THROTTLE: UserThrottleOptions = {
  key: 'manager-analytics',
  limit: 30,
  ttlMs: MS_PER_MINUTE,
  message: 'Слишком много запросов аналитики. Подождите минуту',
};
