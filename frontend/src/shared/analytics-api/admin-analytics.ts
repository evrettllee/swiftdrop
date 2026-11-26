import { http, type HttpOptions } from '@/shared/api';
import {
  type ServiceAnalytics,
  serviceAnalyticsSchema,
  type SupportAnalytics,
  supportAnalyticsSchema,
  type UsersAnalytics,
  usersAnalyticsSchema,
} from './admin-analytics-ops-schemas';
import {
  type BusinessAnalytics,
  businessAnalyticsSchema,
  type DeliveryAnalytics,
  deliveryAnalyticsSchema,
} from './admin-analytics-schemas';
import { type AnalyticsPeriodQuery, buildPeriodSearchParams } from './period-query';

export const ADMIN_ANALYTICS_API_PATHS = {
  BUSINESS: '/admin/analytics/business',
  DELIVERY: '/admin/analytics/delivery',
  USERS: '/admin/analytics/users',
  SUPPORT: '/admin/analytics/support',
  SERVICE: '/admin/analytics/service',
} as const;

export async function getAdminBusinessAnalytics(
  period: AnalyticsPeriodQuery,
  options: HttpOptions = {},
): Promise<BusinessAnalytics> {
  const raw = await http.get(
    `${ADMIN_ANALYTICS_API_PATHS.BUSINESS}?${buildPeriodSearchParams(period)}`,
    options,
  );

  return businessAnalyticsSchema.parse(raw);
}

export async function getAdminDeliveryAnalytics(
  period: AnalyticsPeriodQuery,
  options: HttpOptions = {},
): Promise<DeliveryAnalytics> {
  const raw = await http.get(
    `${ADMIN_ANALYTICS_API_PATHS.DELIVERY}?${buildPeriodSearchParams(period)}`,
    options,
  );

  return deliveryAnalyticsSchema.parse(raw);
}

export async function getAdminUsersAnalytics(
  period: AnalyticsPeriodQuery,
  options: HttpOptions = {},
): Promise<UsersAnalytics> {
  const raw = await http.get(
    `${ADMIN_ANALYTICS_API_PATHS.USERS}?${buildPeriodSearchParams(period)}`,
    options,
  );

  return usersAnalyticsSchema.parse(raw);
}

export async function getAdminSupportAnalytics(
  period: AnalyticsPeriodQuery,
  options: HttpOptions = {},
): Promise<SupportAnalytics> {
  const raw = await http.get(
    `${ADMIN_ANALYTICS_API_PATHS.SUPPORT}?${buildPeriodSearchParams(period)}`,
    options,
  );

  return supportAnalyticsSchema.parse(raw);
}

export async function getAdminServiceAnalytics(
  period: AnalyticsPeriodQuery,
  options: HttpOptions = {},
): Promise<ServiceAnalytics> {
  const raw = await http.get(
    `${ADMIN_ANALYTICS_API_PATHS.SERVICE}?${buildPeriodSearchParams(period)}`,
    options,
  );

  return serviceAnalyticsSchema.parse(raw);
}
