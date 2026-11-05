import { z } from 'zod';
import { CALENDAR_PERIOD, type CalendarPeriod, isCalendarDate } from '@/shared/lib/calendar';
import type { ListParamsConfig } from '@/shared/lib/list-params';
import {
  HISTORY_FIRST_PAGE,
  HISTORY_PAGE_MAX,
  HISTORY_SEARCH_PATTERN,
  HISTORY_SORT,
  type HistorySort,
} from './list';

const dateParam = z.string().refine(isCalendarDate);

export type HistoryParams = {
  period: CalendarPeriod;
  from: string | null;
  to: string | null;
  q: string | null;
  sort: HistorySort | null;
  page: number;
};

export const HISTORY_PARAMS_CONFIG: ListParamsConfig<HistoryParams> = {
  schema: z.object({
    period: z.enum(CALENDAR_PERIOD),
    from: dateParam,
    to: dateParam,
    q: z.string().trim().regex(HISTORY_SEARCH_PATTERN),
    sort: z.enum(HISTORY_SORT),
    page: z.coerce.number().int().min(HISTORY_FIRST_PAGE).max(HISTORY_PAGE_MAX),
  }),
  defaults: {
    period: CALENDAR_PERIOD.THIS_WEEK,
    from: null,
    to: null,
    q: null,
    sort: null,
    page: HISTORY_FIRST_PAGE,
  },
  pageKey: 'page',
  searchKey: 'q',
};

export const PERIOD_RESET: Partial<HistoryParams> = {
  period: CALENDAR_PERIOD.THIS_WEEK,
  from: null,
  to: null,
};

export const FILTERS_RESET: Partial<HistoryParams> = { ...PERIOD_RESET, q: null };
