import { MagnifyingGlassIcon, UsersIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { MANAGED_ROLE, type ManagedRole } from '@/entities/admin-user';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { ADMIN_USERS_TEXTS as TEXTS } from '../config/texts';

const SKELETON_ROWS = 6;

const EMPTY_TITLES: Record<ManagedRole, string> = {
  client: TEXTS.EMPTY_CLIENTS,
  courier: TEXTS.EMPTY_COURIERS,
  manager: TEXTS.EMPTY_MANAGERS,
};

export function UsersSkeleton() {
  return (
    <div
      role="status"
      aria-label={TEXTS.TABLE_LABEL}
      className="rounded-lg bg-surface shadow-md dark:border dark:border-border"
    >
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-5 grow rounded-sm" />
            <Skeleton className="hidden h-5 w-32 rounded-sm lg:block" />
            <Skeleton className="hidden h-5 w-24 rounded-sm lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

type UsersFailedProps = {
  message: string | null;
  onRetry: () => void;
};

export function UsersFailed({ message, onRetry }: UsersFailedProps) {
  return (
    <div className="rounded-lg bg-surface shadow-md dark:border dark:border-border">
      <EmptyState
        icon={WarningCircleIcon}
        title={TEXTS.LIST_FAILED_TITLE}
        text={message ?? TEXTS.LIST_FAILED}
      >
        <Button variant="secondary" onClick={onRetry}>
          {TEXTS.RETRY}
        </Button>
      </EmptyState>
    </div>
  );
}

type UsersEmptyProps = {
  role: ManagedRole;
  isFiltered: boolean;
  action: ReactNode;
};

export function UsersEmpty({ role, isFiltered, action }: UsersEmptyProps) {
  if (isFiltered) {
    return (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title={TEXTS.EMPTY_SEARCH_TITLE}
        text={TEXTS.EMPTY_SEARCH_TEXT}
      />
    );
  }

  return (
    <EmptyState
      icon={UsersIcon}
      title={EMPTY_TITLES[role]}
      text={role === MANAGED_ROLE.CLIENT ? TEXTS.EMPTY_CLIENTS_TEXT : TEXTS.EMPTY_STAFF_TEXT}
    >
      {action}
    </EmptyState>
  );
}
