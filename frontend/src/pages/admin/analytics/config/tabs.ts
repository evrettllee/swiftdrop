export const ADMIN_ANALYTICS_TAB = {
  BUSINESS: 'business',
  DELIVERY: 'delivery',
  USERS: 'users',
  SUPPORT: 'support',
  SERVICE: 'service',
} as const;

export type AdminAnalyticsTab = (typeof ADMIN_ANALYTICS_TAB)[keyof typeof ADMIN_ANALYTICS_TAB];

export const ADMIN_ANALYTICS_TABS_LIST: readonly AdminAnalyticsTab[] = [
  ADMIN_ANALYTICS_TAB.BUSINESS,
  ADMIN_ANALYTICS_TAB.DELIVERY,
  ADMIN_ANALYTICS_TAB.USERS,
  ADMIN_ANALYTICS_TAB.SUPPORT,
  ADMIN_ANALYTICS_TAB.SERVICE,
];

export const ADMIN_ANALYTICS_TAB_PARAM = 'tab';
export const DEFAULT_ADMIN_ANALYTICS_TAB = ADMIN_ANALYTICS_TAB.BUSINESS;

export function parseAdminAnalyticsTab(value: string | null): AdminAnalyticsTab {
  return (ADMIN_ANALYTICS_TABS_LIST as readonly string[]).includes(value ?? '')
    ? (value as AdminAnalyticsTab)
    : DEFAULT_ADMIN_ANALYTICS_TAB;
}
