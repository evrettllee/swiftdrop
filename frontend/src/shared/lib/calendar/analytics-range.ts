import { z } from 'zod';
import { ANALYTICS_MAX_DAYS, type AnalyticsPeriodQuery } from '@/shared/analytics-api';
import type { ListParamsConfig } from '@/shared/lib/list-params';
import { calendarDays, isCalendarDate, shiftCalendarDate } from './calendar';

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
export const PERIOD_PARAM_KEYS = ['period', 'from', 'to'] as const;

export type PeriodParams = {
  period: AnalyticsPeriod;
  from: string | null;
  to: string | null;
};

export const PERIOD_DEFAULTS: PeriodParams = {
  period: ANALYTICS_PERIOD.WEEK,
  from: null,
  to: null,
};

const dateParam = z.string().refine(isCalendarDate);

export const PERIOD_PARAMS_CONFIG: ListParamsConfig<PeriodParams> = {
  schema: z.object({
    period: z.enum(ANALYTICS_PERIOD),
    from: dateParam,
    to: dateParam,
  }),
  defaults: PERIOD_DEFAULTS,
};

export type PeriodValidationErrors = {
  required: string;
  reversed: string;
  tooLong: string;
};

export type PeriodResolution =
  { query: AnalyticsPeriodQuery; error: null } | { query: null; error: string };

export function resolvePeriod(
  params: PeriodParams,
  today: string,
  errors: PeriodValidationErrors,
): PeriodResolution {
  if (params.period !== ANALYTICS_PERIOD.CUSTOM) {
    return {
      query: { from: shiftCalendarDate(today, 1 - PRESET_DAYS[params.period]), to: today },
      error: null,
    };
  }

  const { from, to } = params;

  if (from === null || to === null) {
    return { query: null, error: errors.required };
  }

  if (from > to) {
    return { query: null, error: errors.reversed };
  }

  if (calendarDays(from, to) > ANALYTICS_MAX_DAYS) {
    return { query: null, error: errors.tooLong };
  }

  return { query: { from, to }, error: null };
}

export function previousPeriodDates(from: string, to: string): AnalyticsPeriodQuery {
  const days = calendarDays(from, to);

  return {
    from: shiftCalendarDate(from, -days),
    to: shiftCalendarDate(from, -1),
  };
}
