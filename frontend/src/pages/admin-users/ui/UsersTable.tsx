import { type AdminUserListItem } from '../api/admin-users';
import {
  ADMIN_USER_SORT,
  type AdminUserSort,
  MANAGED_ROLE,
  type ManagedRole,
} from '../config/admin-user';
import { Pagination } from '@/shared/ui/pagination';
import { Table, TABLE_ALIGN, TABLE_SORT, TableHeaderCell } from '@/shared/ui/table';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';
import { UserRow } from './UserRow';

export type UsersPaging = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
};

type UsersTableProps = {
  role: ManagedRole;
  sort: AdminUserSort;
  items: readonly AdminUserListItem[];
  isBusy: boolean;
  paging: UsersPaging;
  onSort: (sort: AdminUserSort) => void;
};

function createdSortOf(sort: AdminUserSort) {
  if (sort === ADMIN_USER_SORT.NEWEST) {
    return TABLE_SORT.DESCENDING;
  }

  return sort === ADMIN_USER_SORT.OLDEST ? TABLE_SORT.ASCENDING : undefined;
}

export function UsersTable({ role, sort, items, isBusy, paging, onSort }: UsersTableProps) {
  return (
    <div aria-busy={isBusy}>
      <Table
        label={TEXTS.TABLE_LABEL}
        footer={
          <Pagination
            page={paging.page}
            totalPages={paging.totalPages}
            total={paging.total}
            pageSize={paging.pageSize}
            onChange={paging.onPage}
          />
        }
      >
        <thead>
          <tr>
            <TableHeaderCell>{TEXTS.COLUMN_USER}</TableHeaderCell>
            <TableHeaderCell>{TEXTS.COLUMN_PHONE}</TableHeaderCell>
            {role === MANAGED_ROLE.COURIER ? (
              <TableHeaderCell>{TEXTS.COLUMN_VEHICLE}</TableHeaderCell>
            ) : null}
            {role === MANAGED_ROLE.MANAGER ? null : (
              <TableHeaderCell align={TABLE_ALIGN.END}>
                {role === MANAGED_ROLE.COURIER ? TEXTS.COLUMN_DELIVERED : TEXTS.COLUMN_ORDERS}
              </TableHeaderCell>
            )}
            <TableHeaderCell
              sort={createdSortOf(sort)}
              onSort={() =>
                onSort(
                  sort === ADMIN_USER_SORT.NEWEST ? ADMIN_USER_SORT.OLDEST : ADMIN_USER_SORT.NEWEST,
                )
              }
            >
              {TEXTS.COLUMN_CREATED}
            </TableHeaderCell>
            <TableHeaderCell className="min-w-38">{TEXTS.COLUMN_STATUS}</TableHeaderCell>
            <TableHeaderCell>
              <span className="sr-only">{TEXTS.COLUMN_OPEN}</span>
            </TableHeaderCell>
          </tr>
        </thead>
        <tbody>
          {items.map((user) => (
            <UserRow key={user.userId} user={user} role={role} />
          ))}
        </tbody>
      </Table>
    </div>
  );
}
