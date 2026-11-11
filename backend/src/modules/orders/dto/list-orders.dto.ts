import { z } from 'zod';
import {
  csvEnumSchema,
  listPeriodShape,
  listSearchSchema,
  listSortParamSchema,
  resolveListQuery,
  unknownParameterError,
} from '@/common/schemas/list-query.schema';
import { listPaginationShape } from '@/common/schemas/pagination.schema';
import { ORDER_STATUS_GROUP_VALUES, ORDERS_PAGE_SIZE_DEFAULT } from '../constants/orders.constants';
import { parseClientOrderSearch } from '../utils/order-search';
import { ORDERS_SORT } from '../utils/orders-sort';

export const listOrdersSchema = z
  .strictObject(
    {
      ...listPaginationShape(ORDERS_PAGE_SIZE_DEFAULT),
      ...listPeriodShape,
      sort: listSortParamSchema,
      status: csvEnumSchema(ORDER_STATUS_GROUP_VALUES).optional(),
      q: listSearchSchema.transform(parseClientOrderSearch).optional(),
    },
    { error: unknownParameterError },
  )
  .transform((query, ctx) => {
    const list = resolveListQuery(query, ORDERS_SORT, ctx);

    return list ? { ...list, status: query.status ?? null, search: query.q ?? null } : z.NEVER;
  });

export type ListOrdersDto = z.infer<typeof listOrdersSchema>;
