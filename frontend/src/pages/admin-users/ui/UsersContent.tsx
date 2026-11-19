import type { ReactNode } from 'react';
import { LIST_STATUS } from '@/shared/config';
import { LIST_PAGE_SIZE } from '@/shared/lib/list-params';
import type { useAdminUsers } from '../model/useAdminUsers';
import { UserCards } from './UserCards';
import { UsersEmpty, UsersFailed, UsersSkeleton } from './UsersStates';
import { UsersTable } from './UsersTable';

type UsersContentProps = {
  users: ReturnType<typeof useAdminUsers>;
  isDesktop: boolean;
  emptyAction: ReactNode;
};

export function UsersContent({ users, isDesktop, emptyAction }: UsersContentProps) {
  const { values, list, change } = users;
  const isEmpty = list.items.length === 0;
  const paging = {
    page: values.page,
    totalPages: Math.max(1, list.totalPages),
    total: list.total,
    pageSize: LIST_PAGE_SIZE,
    onPage: (page: number) => change({ page }),
  };

  if (isEmpty && list.status === LIST_STATUS.LOADING) {
    return <UsersSkeleton />;
  }

  if (isEmpty && list.status === LIST_STATUS.ERROR) {
    return <UsersFailed message={list.message} onRetry={list.retry} />;
  }

  if (isEmpty) {
    return <UsersEmpty role={values.role} isFiltered={users.isFiltered} action={emptyAction} />;
  }

  return isDesktop ? (
    <UsersTable
      role={values.role}
      sort={values.sort}
      items={list.items}
      isBusy={users.isLoading}
      paging={paging}
      onSort={(sort) => change({ sort })}
    />
  ) : (
    <UserCards role={values.role} items={list.items} isBusy={users.isLoading} paging={paging} />
  );
}
