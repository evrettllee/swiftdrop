import { z } from 'zod';
import {
  LIST_FIRST_PAGE,
  LIST_OFFSET_MAX,
  LIST_SORT_SEPARATOR,
  LIST_VALIDATION_MESSAGES,
  SORT_DIRECTION_VALUES,
} from '@/common/constants/list.constants';
import type { SortDirection } from '@/common/database/list-sort';
import {
  listPeriodShape,
  listSortParamSchema,
  unknownParameterError,
} from '@/common/schemas/list-query.schema';
import { listPaginationShape } from '@/common/schemas/pagination.schema';
import {
  ANALYTICS_COURIER_DEFAULT_SORT,
  ANALYTICS_COURIER_SORT_KEYS,
  ANALYTICS_COURIERS_PAGE_SIZE_DEFAULT,
  ANALYTICS_PERIOD,
  ANALYTICS_VALIDATION_MESSAGES,
  type AnalyticsCourierSortKey,
} from '../constants/manager-analytics.constants';
import type { AnalyticsCourierSort } from '../types/manager-analytics.types';
import { periodDays } from '../utils/analytics-period';

type RawPeriod = { from?: string; to?: string };

function checkPeriod(query: RawPeriod, ctx: z.RefinementCtx): void {
  if (query.from === undefined || query.to === undefined) {
    return;
  }

  if (query.from > query.to) {
    ctx.addIssue({
      code: 'custom',
      path: ['from'],
      message: LIST_VALIDATION_MESSAGES.PERIOD_INVALID,
    });
  } else if (periodDays(query.from, query.to) > ANALYTICS_PERIOD.MAX_DAYS) {
    ctx.addIssue({
      code: 'custom',
      path: ['from'],
      message: ANALYTICS_VALIDATION_MESSAGES.PERIOD_TOO_LONG,
    });
  }
}

export function parseCourierSort(raw: string | undefined): AnalyticsCourierSort | null {
  if (raw === undefined) {
    return ANALYTICS_COURIER_DEFAULT_SORT;
  }

  const [key, direction, ...rest] = raw.split(LIST_SORT_SEPARATOR);
  const isKey = (ANALYTICS_COURIER_SORT_KEYS as readonly string[]).includes(key);
  const isDirection = (SORT_DIRECTION_VALUES as readonly string[]).includes(direction);

  return isKey && isDirection && rest.length === 0
    ? { key: key as AnalyticsCourierSortKey, direction: direction as SortDirection }
    : null;
}

export const analyticsSummarySchema = z
  .strictObject(listPeriodShape, { error: unknownParameterError })
  .superRefine(checkPeriod);

export type AnalyticsSummaryDto = z.infer<typeof analyticsSummarySchema>;

const { page, limit } = listPaginationShape(ANALYTICS_COURIERS_PAGE_SIZE_DEFAULT);

export const analyticsCouriersSchema = z
  .strictObject(
    { ...listPeriodShape, sort: listSortParamSchema, page, limit },
    { error: unknownParameterError },
  )
  .superRefine(checkPeriod)
  .transform((query, ctx) => {
    const sort = parseCourierSort(query.sort);
    const pageNumber = query.page ?? LIST_FIRST_PAGE;

    if (sort === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['sort'],
        message: LIST_VALIDATION_MESSAGES.SORT_INVALID,
      });

      return z.NEVER;
    }

    if ((pageNumber - LIST_FIRST_PAGE) * query.limit > LIST_OFFSET_MAX) {
      ctx.addIssue({ code: 'custom', path: ['page'], message: LIST_VALIDATION_MESSAGES.TOO_DEEP });

      return z.NEVER;
    }

    return { from: query.from, to: query.to, sort, page: pageNumber, limit: query.limit };
  });

export type AnalyticsCouriersDto = z.infer<typeof analyticsCouriersSchema>;
