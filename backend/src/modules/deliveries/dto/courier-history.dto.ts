import { z } from 'zod';
import {
  listSortParamSchema,
  resolveListQuery,
  unknownParameterError,
} from '@/common/schemas/list-query.schema';
import { listPaginationShape } from '@/common/schemas/pagination.schema';
import { HISTORY_PAGE_SIZE_DEFAULT } from '../constants/deliveries.constants';
import { HISTORY_SORT } from '../utils/history-sort';

export const courierHistorySchema = z
  .strictObject(
    {
      ...listPaginationShape(HISTORY_PAGE_SIZE_DEFAULT),
      sort: listSortParamSchema,
    },
    { error: unknownParameterError },
  )
  .transform((query, ctx) => resolveListQuery(query, HISTORY_SORT, ctx) ?? z.NEVER);

export type CourierHistoryDto = z.infer<typeof courierHistorySchema>;
