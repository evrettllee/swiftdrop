import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { COURIER_HISTORY_STATUSES } from '@/common/constants/orders.constants';
import {
  listPeriodShape,
  listSearchSchema,
  listSortParamSchema,
  resolveListQuery,
  unknownParameterError,
} from '@/common/schemas/list-query.schema';
import { listPaginationShape } from '@/common/schemas/pagination.schema';
import {
  HISTORY_NUMBER_SEARCH,
  HISTORY_PAGE_SIZE_DEFAULT,
  HISTORY_VALIDATION_MESSAGES,
} from '../constants/deliveries.constants';
import { HISTORY_SORT } from '../utils/history-sort';

export type HistorySearch = { orderId: number | null };

function toSearch(digits: string): HistorySearch {
  const value = Number(digits);

  return { orderId: value > 0 && value <= DB_INTEGER_MAX ? value : null };
}

const historySearchSchema = listSearchSchema
  .pipe(
    z.string().regex(HISTORY_NUMBER_SEARCH, {
      error: HISTORY_VALIDATION_MESSAGES.SEARCH_NOT_NUMBER,
    }),
  )
  .transform(toSearch);

export const courierHistorySchema = z
  .strictObject(
    {
      ...listPaginationShape(HISTORY_PAGE_SIZE_DEFAULT),
      ...listPeriodShape,
      sort: listSortParamSchema,
      q: historySearchSchema.optional(),
      status: z
        .enum(COURIER_HISTORY_STATUSES, { error: HISTORY_VALIDATION_MESSAGES.STATUS_INVALID })
        .optional(),
    },
    { error: unknownParameterError },
  )
  .transform((query, ctx) => {
    const list = resolveListQuery(query, HISTORY_SORT, ctx);

    return list ? { ...list, search: query.q ?? null, status: query.status ?? null } : z.NEVER;
  });

export type CourierHistoryDto = z.infer<typeof courierHistorySchema>;
