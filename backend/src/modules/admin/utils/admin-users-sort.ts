import { asc, type SQL } from 'drizzle-orm';
import { SORT_DIRECTION, SORT_VALUE_KIND } from '@/common/constants/list.constants';
import type { SortSpec } from '@/common/database/list-sort';
import { users } from '@/database/schema';
import { ADMIN_USER_SORT_KEY } from '../constants/admin-users.constants';

type AdminUsersSortKey = (typeof ADMIN_USER_SORT_KEY)[keyof typeof ADMIN_USER_SORT_KEY];

export const ADMIN_USERS_SORT_SPEC: SortSpec<AdminUsersSortKey> = {
  whitelist: {
    [ADMIN_USER_SORT_KEY.CREATED_AT]: { column: users.createdAt, kind: SORT_VALUE_KIND.TIMESTAMP },
    [ADMIN_USER_SORT_KEY.NAME]: { column: users.userId, kind: SORT_VALUE_KIND.INTEGER },
  },
  idColumn: users.userId,
  defaultSort: { key: ADMIN_USER_SORT_KEY.CREATED_AT, direction: SORT_DIRECTION.DESC },
};

export const NAME_ORDER: SQL[] = [asc(users.lastName), asc(users.firstName), asc(users.userId)];
