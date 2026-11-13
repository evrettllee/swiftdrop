import { z } from 'zod';
import { DB_INTEGER_MAX } from '@/common/constants/database.constants';
import { SORT_DIRECTION } from '@/common/constants/list.constants';
import {
  csvEnumSchema,
  listSearchSchema,
  resolveListQuery,
  unknownParameterError,
} from '@/common/schemas/list-query.schema';
import { listPaginationShape } from '@/common/schemas/pagination.schema';
import {
  ADMIN_USER_SORT,
  ADMIN_USER_SORT_KEY,
  ADMIN_USER_SORT_VALUES,
  ADMIN_USERS_PAGE_SIZE_DEFAULT,
  ADMIN_USERS_VALIDATION_MESSAGES as MESSAGES,
  DEFAULT_USER_STATUSES,
  MANAGED_ROLES,
  USER_STATUS_VALUES,
} from '../constants/admin-users.constants';
import type { AdminUserSort } from '../types/admin-users.types';
import { ADMIN_USERS_SORT_SPEC } from '../utils/admin-users-sort';
import { parseUserSearch } from '../utils/user-search';

const LIST_SORT_OF: Record<AdminUserSort, string> = {
  [ADMIN_USER_SORT.NEWEST]: `${ADMIN_USER_SORT_KEY.CREATED_AT}:${SORT_DIRECTION.DESC}`,
  [ADMIN_USER_SORT.OLDEST]: `${ADMIN_USER_SORT_KEY.CREATED_AT}:${SORT_DIRECTION.ASC}`,
  [ADMIN_USER_SORT.NAME]: `${ADMIN_USER_SORT_KEY.NAME}:${SORT_DIRECTION.ASC}`,
};

const { page, limit, until } = listPaginationShape(ADMIN_USERS_PAGE_SIZE_DEFAULT);

const filterShape = {
  status: csvEnumSchema(USER_STATUS_VALUES).optional(),
  q: listSearchSchema.transform(parseUserSearch).optional(),
};

function filtersOf(raw: z.infer<z.ZodObject<typeof filterShape>>) {
  return { statuses: raw.status ?? [...DEFAULT_USER_STATUSES], search: raw.q ?? null };
}

export const adminUsersSchema = z
  .strictObject(
    {
      ...filterShape,
      role: z.enum(MANAGED_ROLES, { error: MESSAGES.ROLE_INVALID }),
      sort: z.enum(ADMIN_USER_SORT_VALUES, { error: MESSAGES.SORT_INVALID }).optional(),
      page,
      limit,
      until,
    },
    { error: unknownParameterError },
  )
  .transform((query, ctx) => {
    const sort = query.sort ?? ADMIN_USER_SORT.NEWEST;
    const list = resolveListQuery(
      { page: query.page, limit: query.limit, until: query.until, sort: LIST_SORT_OF[sort] },
      ADMIN_USERS_SORT_SPEC,
      ctx,
    );

    return list ? { ...list, ...filtersOf(query), role: query.role, sortName: sort } : z.NEVER;
  });

export type AdminUsersDto = z.infer<typeof adminUsersSchema>;

export const adminUserCountsSchema = z
  .strictObject(filterShape, { error: unknownParameterError })
  .transform(filtersOf);

export type AdminUserCountsDto = z.infer<typeof adminUserCountsSchema>;

export const userIdParamSchema = z.object({
  userId: z.coerce
    .number({ error: MESSAGES.USER_ID_INVALID })
    .int({ error: MESSAGES.USER_ID_INVALID })
    .positive({ error: MESSAGES.USER_ID_INVALID })
    .max(DB_INTEGER_MAX, { error: MESSAGES.USER_ID_INVALID }),
});

export type UserIdParamDto = z.infer<typeof userIdParamSchema>;
