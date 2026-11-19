import { useCallback, useMemo } from 'react';
import { type AdminUserListItem, type AdminUsersPage, getAdminUsers } from '../api/admin-users';
import { type ManagedRole } from '../config/admin-user';
import { getApiErrorMessage } from '@/shared/api';
import { LIST_STATUS } from '@/shared/config';
import { usePagedList } from '@/shared/lib/list-feed';
import { LIST_PAGE_SIZE, listParamsKey, useListParams } from '@/shared/lib/list-params';
import { USERS_PARAMS_CONFIG, type UsersParams } from '../config/list-params';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';
import { appliedFilters, tabPatch, toUsersQuery } from './users-view';
import { useUserCounts } from './useUserCounts';

export function useAdminUsers() {
  const params = useListParams(USERS_PARAMS_CONFIG);
  const { values, update, until, setUntil, resetUntil } = params;
  const filters = useMemo(() => appliedFilters(values), [values]);
  const list = usePagedList<AdminUserListItem, AdminUsersPage>({
    key: listParamsKey(values, USERS_PARAMS_CONFIG),
    page: values.page,
    pageSize: LIST_PAGE_SIZE,
    until,
    onUntil: setUntil,
    isEnabled: true,
    load: (page, pageUntil, signal) => getAdminUsers(toUsersQuery(values, page, pageUntil), signal),
    messageOf: (error) => getApiErrorMessage(error, TEXTS.LIST_FAILED),
  });
  const counts = useUserCounts(values.status, values.q);
  const { retry } = list;
  const reloadCounts = counts.reload;

  const change = useCallback((patch: Partial<UsersParams>) => update(patch), [update]);

  const refresh = useCallback(() => {
    resetUntil();
    retry();
    reloadCounts();
  }, [resetUntil, retry, reloadCounts]);

  const showRole = useCallback(
    (role: ManagedRole) => {
      if (role === values.role) {
        refresh();
      } else {
        resetUntil();
        reloadCounts();
        update(tabPatch(role));
      }
    },
    [values.role, refresh, resetUntil, reloadCounts, update],
  );

  return {
    params,
    values,
    filters,
    isFiltered: filters.length > 0,
    list,
    isLoading: list.status === LIST_STATUS.LOADING,
    counts: counts.counts,
    change,
    showRole,
  };
}
