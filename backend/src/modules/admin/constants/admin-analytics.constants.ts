import { MS_PER_MINUTE } from '@/common/constants/time.constants';
import type { UserThrottleOptions } from '@/common/guards/user-throttle.guard';

export const ADMIN_ANALYTICS_ROUTES = {
  BASE: 'admin/analytics',
  BUSINESS: 'business',
  DELIVERY: 'delivery',
  USERS: 'users',
  SUPPORT: 'support',
  SERVICE: 'service',
} as const;

export const ADMIN_ANALYTICS_THROTTLE: UserThrottleOptions = {
  key: 'admin-analytics',
  limit: 30,
  ttlMs: MS_PER_MINUTE,
  message: 'Слишком много запросов аналитики. Подождите минуту',
};
