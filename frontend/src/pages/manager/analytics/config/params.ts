import { z } from 'zod';
import {
  ANALYTICS_COURIER_SORTS,
  ANALYTICS_DEFAULT_COURIER_SORT,
  type AnalyticsCourierSort,
} from '@/shared/analytics-api';
import { isCalendarDate } from '@/shared/lib/calendar';
import type { ListParamsConfig } from '@/shared/lib/list-params';
import { ANALYTICS_PERIOD, type AnalyticsPeriod } from './analytics';

const PAGE_MAX = 10_000;

const dateParam = z.string().refine(isCalendarDate);

const periodShape = {
  period: z.enum(ANALYTICS_PERIOD),
  from: dateParam,
  to: dateParam,
};

export type PeriodParams = {
  period: AnalyticsPeriod;
  from: string | null;
  to: string | null;
};

const PERIOD_DEFAULTS: PeriodParams = { period: ANALYTICS_PERIOD.WEEK, from: null, to: null };

export const PERIOD_PARAMS_CONFIG: ListParamsConfig<PeriodParams> = {
  schema: z.object(periodShape),
  defaults: PERIOD_DEFAULTS,
};

export type CouriersParams = PeriodParams & {
  sort: AnalyticsCourierSort;
  page: number;
};

export const COURIERS_PARAMS_CONFIG: ListParamsConfig<CouriersParams> = {
  schema: z.object({
    ...periodShape,
    sort: z
      .string()
      .refine((value): value is AnalyticsCourierSort =>
        ANALYTICS_COURIER_SORTS.some((sort) => sort === value),
      ),
    page: z.coerce.number().int().min(1).max(PAGE_MAX),
  }),
  defaults: { ...PERIOD_DEFAULTS, sort: ANALYTICS_DEFAULT_COURIER_SORT, page: 1 },
  pageKey: 'page',
};

export const PERIOD_PARAM_KEYS = ['period', 'from', 'to'] as const;
