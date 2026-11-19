import type { ReactNode } from 'react';
import { getInitials } from '@/shared/lib/format';
import { Avatar } from '@/shared/ui/avatar';

type UserIdentityProps = {
  firstName: string;
  lastName: string;
  email: string;
  name?: ReactNode;
};

export function UserIdentity({ firstName, lastName, email, name }: UserIdentityProps) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar initials={getInitials(firstName, lastName)} size="small" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-small font-semibold text-fg">
          {name ?? `${firstName} ${lastName}`}
        </span>
        <span className="truncate text-caption text-fg-secondary">{email}</span>
      </span>
    </span>
  );
}
