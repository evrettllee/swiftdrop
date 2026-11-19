import { CaretRightIcon } from '@phosphor-icons/react';
import { Link } from 'react-router';
import { type AdminUserListItem } from '../api/admin-users';
import { MANAGED_ROLE, type ManagedRole } from '../config/admin-user';
import { UserIdentity } from './UserIdentity';
import { UserStatus } from './UserStatus';
import { UserVehicle } from './UserVehicle';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { getAdminUserPath } from '@/shared/routes';
import { Pagination } from '@/shared/ui/pagination';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';
import { PhoneText } from './UserRow';
import type { UsersPaging } from './UsersTable';

function CardFacts({ user, role }: { user: AdminUserListItem; role: ManagedRole }) {
  if (role === MANAGED_ROLE.COURIER) {
    return (
      <>
        <UserVehicle type={user.vehicleType} />
        <span aria-hidden="true">·</span>
        <span>{TEXTS.deliveredCount(user.deliveredCount ?? 0)}</span>
      </>
    );
  }

  return (
    <>
      <PhoneText phone={user.phone} />
      {role === MANAGED_ROLE.CLIENT ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{TEXTS.ordersCount(user.ordersCount ?? 0)}</span>
        </>
      ) : null}
    </>
  );
}

function UserCard({ user, role }: { user: AdminUserListItem; role: ManagedRole }) {
  const name = (
    <Link
      to={getAdminUserPath(user.userId)}
      className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
    >
      {user.firstName} {user.lastName}
    </Link>
  );

  return (
    <article className="relative flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-md has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent dark:border dark:border-border">
      <div className="flex items-start justify-between gap-3">
        <UserIdentity
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
          name={name}
        />
        <span className="shrink-0 text-small">
          <UserStatus status={user.status} />
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 text-small text-fg-secondary">
        <span className="flex min-w-0 flex-wrap items-center gap-x-1 tabular-nums">
          <CardFacts user={user} role={role} />
        </span>
        <CaretRightIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
      </div>
    </article>
  );
}

type UserCardsProps = {
  role: ManagedRole;
  items: readonly AdminUserListItem[];
  isBusy: boolean;
  paging: UsersPaging;
};

export function UserCards({ role, items, isBusy, paging }: UserCardsProps) {
  return (
    <div className="flex flex-col gap-4" aria-busy={isBusy}>
      <ul className="flex flex-col gap-4" aria-label={TEXTS.TABLE_LABEL}>
        {items.map((user) => (
          <li key={user.userId}>
            <UserCard user={user} role={role} />
          </li>
        ))}
      </ul>
      <div className="[&>nav]:flex-col [&>nav]:justify-center">
        <Pagination
          page={paging.page}
          totalPages={paging.totalPages}
          total={paging.total}
          pageSize={paging.pageSize}
          onChange={paging.onPage}
        />
      </div>
    </div>
  );
}
