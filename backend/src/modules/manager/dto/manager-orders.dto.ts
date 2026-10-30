import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { LIST_VALIDATION_MESSAGES } from '@/common/constants/list.constants';
import { APP_TIME_ZONE } from '@/common/constants/time.constants';
import {
  csvEnumSchema,
  listPeriodShape,
  listSearchSchema,
  listSortParamSchema,
  resolveListQuery,
  unknownParameterError,
} from '@/common/schemas/list-query.schema';
import { listPaginationShape } from '@/common/schemas/pagination.schema';
import { toDateRange } from '@/common/utils/date-range';
import {
  FRAGILE_ONLY,
  MANAGER_ORDERS_PAGE_SIZE_DEFAULT,
  MANAGER_ORDERS_VALIDATION_MESSAGES,
  MANAGER_STATUS_GROUP_VALUES,
  PAYMENT_STATE_VALUES,
  TEXT_SEARCH_MIN_LENGTH,
} from '../constants/manager-orders.constants';
import type { ManagerOrderFilters, OrderSearch } from '../types/manager-orders.types';
import { MANAGER_ORDERS_SORT } from '../utils/manager-orders-sort';
import { parseOrderSearch } from '../utils/order-search';

function toSearch(query: string, ctx: z.RefinementCtx): OrderSearch {
  const search = parseOrderSearch(query);

  if (search.kind === 'text' && query.length < TEXT_SEARCH_MIN_LENGTH) {
    ctx.addIssue({
      code: 'custom',
      message: MANAGER_ORDERS_VALIDATION_MESSAGES.TEXT_SEARCH_TOO_SHORT,
    });

    return z.NEVER;
  }

  return search;
}

export const managerOrderFilterShape = {
  ...listPeriodShape,
  courierId: z.coerce
    .number({ error: MANAGER_ORDERS_VALIDATION_MESSAGES.COURIER_ID_INVALID })
    .int({ error: MANAGER_ORDERS_VALIDATION_MESSAGES.COURIER_ID_INVALID })
    .positive({ error: MANAGER_ORDERS_VALIDATION_MESSAGES.COURIER_ID_INVALID })
    .max(DB_INTEGER_MAX, { error: MANAGER_ORDERS_VALIDATION_MESSAGES.COURIER_ID_INVALID })
    .optional(),
  payment: csvEnumSchema(PAYMENT_STATE_VALUES).optional(),
  fragile: z
    .literal(FRAGILE_ONLY, { error: MANAGER_ORDERS_VALIDATION_MESSAGES.FRAGILE_INVALID })
    .optional(),
  q: listSearchSchema.transform(toSearch).optional(),
};

type RawFilters = z.infer<z.ZodObject<typeof managerOrderFilterShape>>;

export function toManagerOrderFilters(raw: RawFilters): ManagerOrderFilters {
  return {
    period: toDateRange(raw, APP_TIME_ZONE),
    courierId: raw.courierId ?? null,
    payment: raw.payment ?? null,
    fragile: raw.fragile === FRAGILE_ONLY,
    search: raw.q ?? null,
  };
}

export const managerStatusGroupsSchema = csvEnumSchema(MANAGER_STATUS_GROUP_VALUES).optional();

export function hasValidPeriod(query: { from?: string; to?: string }): boolean {
  return !(query.from && query.to && query.from > query.to);
}

export const managerOrdersSchema = z
  .strictObject(
    {
      ...listPaginationShape(MANAGER_ORDERS_PAGE_SIZE_DEFAULT),
      ...managerOrderFilterShape,
      sort: listSortParamSchema,
      status: managerStatusGroupsSchema,
    },
    { error: unknownParameterError },
  )
  .transform((query, ctx) => {
    const list = resolveListQuery(query, MANAGER_ORDERS_SORT, ctx);

    return list
      ? { ...list, filters: toManagerOrderFilters(query), status: query.status ?? null }
      : z.NEVER;
  });

export type ManagerOrdersDto = z.infer<typeof managerOrdersSchema>;

export const managerOrderCountsSchema = z
  .strictObject(
    {
      ...managerOrderFilterShape,
      until: listPaginationShape(MANAGER_ORDERS_PAGE_SIZE_DEFAULT).until,
    },
    { error: unknownParameterError },
  )
  .refine(hasValidPeriod, {
    error: LIST_VALIDATION_MESSAGES.PERIOD_INVALID,
    path: ['from'],
  })
  .transform((query) => ({ filters: toManagerOrderFilters(query), until: query.until ?? null }));

export type ManagerOrderCountsDto = z.infer<typeof managerOrderCountsSchema>;
