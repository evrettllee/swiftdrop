export const ANALYTICS_PERIOD = {
  WEEK: '7d',
  MONTH: '30d',
  QUARTER: '90d',
  CUSTOM: 'custom',
} as const;

export type AnalyticsPeriod = (typeof ANALYTICS_PERIOD)[keyof typeof ANALYTICS_PERIOD];

export type AnalyticsPreset = Exclude<AnalyticsPeriod, typeof ANALYTICS_PERIOD.CUSTOM>;

export const PRESET_DAYS: Record<AnalyticsPreset, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const PERIOD_DEBOUNCE_MS = 300;
export const TOP_COURIERS_LIMIT = 5;

export const CHART = {
  INTERVALS: 4,
  HOURS_FROM: 8,
  HOURS_TO: 22,
  BAR_VALUES_MAX: 14,
} as const;

export const AXIS_LABELS_MAX = {
  DAYS_DESKTOP: 10,
  DAYS_PHONE: 7,
  HOURS_DESKTOP: 24,
  HOURS_PHONE: 8,
} as const;
