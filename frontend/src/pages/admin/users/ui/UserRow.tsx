import { CaretRightIcon } from '@phosphor-icons/react';
import { memo } from 'react';
import { Link } from 'react-router';
import { type AdminUserListItem } from '../api/admin-users';
import {
  MANAGED_ROLE,
  type ManagedRole,
  UserIdentity,
  UserStatus,
  UserVehicle,
} from '@/entities/admin-user';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { formatPhone, formatShortDate } from '@/shared/lib/format';
import { getAdminUserPath } from '@/shared/routes';
import { TABLE_ALIGN, TableCell, TableRow } from '@/shared/ui/table';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';

export function PhoneText({ phone }: { phone: string | null }) {
  return phone === null ? (
    <span className="text-fg-muted">{TEXTS.NO_PHONE}</span>
  ) : (
    <span className="tabular-nums">{formatPhone(phone)}</span>
  );
}

type UserRowProps = {
  user: AdminUserListItem;
  role: ManagedRole;
  listSearch: string;
};

export const UserRow = memo(function UserRow({ user, role, listSearch }: UserRowProps) {
  const name = (
    <Link
      to={getAdminUserPath(user.userId, listSearch)}
      className="after:absolute after:inset-0 focus-visible:outline-none"
    >
      {user.firstName} {user.lastName}
    </Link>
  );

  return (
    <TableRow>
      <TableCell className="max-w-72">
        <UserIdentity
          firstName={user.firstName}
          lastName={user.lastName}
          email={user.email}
          name={name}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <PhoneText phone={user.phone} />
      </TableCell>
      {role === MANAGED_ROLE.COURIER ? (
        <TableCell>
          <UserVehicle type={user.vehicleType} />
        </TableCell>
      ) : null}
      {role === MANAGED_ROLE.MANAGER ? null : (
        <TableCell align={TABLE_ALIGN.END} className="tabular-nums">
          {role === MANAGED_ROLE.COURIER ? (user.deliveredCount ?? 0) : (user.ordersCount ?? 0)}
        </TableCell>
      )}
      <TableCell className="whitespace-nowrap text-fg-secondary tabular-nums">
        {formatShortDate(user.createdAt)}
      </TableCell>
      <TableCell>
        <UserStatus status={user.status} />
      </TableCell>
      <TableCell align={TABLE_ALIGN.END} className="w-11">
        <span className="inline-grid size-11 place-items-center text-fg-secondary">
          <CaretRightIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} aria-hidden="true" />
        </span>
      </TableCell>
    </TableRow>
  );
});
