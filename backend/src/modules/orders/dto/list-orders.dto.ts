import { z } from 'zod';
import {
  csvEnumSchema,
  listPeriodShape,
  listSortParamSchema,
  resolveListQuery,
  unknownParameterError,
} from '@/common/schemas/list-query.schema';
import { listPaginationShape } from '@/common/schemas/pagination.schema';
import {
  ORDER_LIST_FILTER_VALUES,
  ORDER_STATUS_GROUP_VALUES,
  ORDERS_PAGE_SIZE_DEFAULT,
  ORDERS_VALIDATION_MESSAGES,
} from '../constants/orders.constants';
import { ORDERS_SORT } from '../utils/orders-sort';

export const listOrdersSchema = z
  .strictObject(
    {
      ...listPaginationShape(ORDERS_PAGE_SIZE_DEFAULT),
      ...listPeriodShape,
      sort: listSortParamSchema,
      filter: z
        .enum(ORDER_LIST_FILTER_VALUES, { error: ORDERS_VALIDATION_MESSAGES.FILTER_INVALID })
        .optional(),
      status: csvEnumSchema(ORDER_STATUS_GROUP_VALUES).optional(),
    },
    { error: unknownParameterError },
  )
  .refine((query) => query.filter === undefined || query.status === undefined, {
    error: ORDERS_VALIDATION_MESSAGES.FILTER_AND_STATUS,
    path: ['status'],
  })
  .transform((query, ctx) => {
    const list = resolveListQuery(query, ORDERS_SORT, ctx);

    return list ? { ...list, filter: query.filter ?? null, status: query.status ?? null } : z.NEVER;
  });

export type ListOrdersDto = z.infer<typeof listOrdersSchema>;
