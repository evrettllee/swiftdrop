import { z } from 'zod';
import { LIST_VALIDATION_MESSAGES } from '@/common/constants/list.constants';
import {
  listSortParamSchema,
  resolveListSort,
  unknownParameterError,
} from '@/common/schemas/list-query.schema';
import {
  EXPORT_FLAG_TRUE,
  EXPORT_FLAG_VALUES,
  EXPORT_FORMAT_VALUES,
  MANAGER_EXPORT_MESSAGES,
} from '../constants/manager-export.constants';
import { MANAGER_ORDERS_SORT } from '../utils/manager-orders-sort';
import {
  hasValidPeriod,
  managerOrderFilterShape,
  managerStatusGroupsSchema,
  toManagerOrderFilters,
} from './manager-orders.dto';

export const managerOrdersExportSchema = z
  .strictObject(
    {
      ...managerOrderFilterShape,
      sort: listSortParamSchema,
      status: managerStatusGroupsSchema,
      format: z.enum(EXPORT_FORMAT_VALUES, { error: MANAGER_EXPORT_MESSAGES.FORMAT_INVALID }),
      withPhones: z
        .enum(EXPORT_FLAG_VALUES, { error: MANAGER_EXPORT_MESSAGES.WITH_PHONES_INVALID })
        .optional(),
    },
    { error: unknownParameterError },
  )
  .refine(hasValidPeriod, { error: LIST_VALIDATION_MESSAGES.PERIOD_INVALID, path: ['from'] })
  .transform((query, ctx) => {
    const sort = resolveListSort(query.sort, MANAGER_ORDERS_SORT, ctx);

    return sort
      ? {
          sort,
          filters: toManagerOrderFilters(query),
          status: query.status ?? null,
          format: query.format,
          withPhones: query.withPhones === EXPORT_FLAG_TRUE,
        }
      : z.NEVER;
  });

export type ManagerOrdersExportDto = z.infer<typeof managerOrdersExportSchema>;
