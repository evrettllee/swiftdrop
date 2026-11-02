import { MagnifyingGlassIcon, PackageIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { MANAGER_ORDERS_TEXTS } from '../config/texts';

const SKELETON_ROWS = 6;

function StateCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-surface shadow-md dark:border dark:border-border">{children}</div>
  );
}

export function OrdersListSkeleton() {
  return (
    <div role="status" aria-label={MANAGER_ORDERS_TEXTS.TABLE_LABEL} className="flex flex-col">
      <StateCard>
        <div className="flex flex-col gap-4 p-4">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <div key={index} className="flex items-center gap-4">
              <Skeleton className="h-10 w-24 rounded-sm" />
              <Skeleton className="h-5 grow rounded-sm" />
              <Skeleton className="hidden h-5 w-24 rounded-sm lg:block" />
            </div>
          ))}
        </div>
      </StateCard>
    </div>
  );
}

type OrdersFailedProps = {
  message: string | null;
  onRetry: () => void;
};

export function OrdersFailed({ message, onRetry }: OrdersFailedProps) {
  return (
    <StateCard>
      <EmptyState
        icon={WarningCircleIcon}
        title={MANAGER_ORDERS_TEXTS.LIST_FAILED_TITLE}
        text={message ?? MANAGER_ORDERS_TEXTS.LIST_FAILED}
      >
        <Button variant="secondary" onClick={onRetry}>
          {MANAGER_ORDERS_TEXTS.RETRY}
        </Button>
      </EmptyState>
    </StateCard>
  );
}

type OrdersEmptyProps = {
  isFiltered: boolean;
  text: string;
};

export function OrdersEmpty({ isFiltered, text }: OrdersEmptyProps) {
  return (
    <StateCard>
      {isFiltered ? (
        <EmptyState
          icon={MagnifyingGlassIcon}
          title={MANAGER_ORDERS_TEXTS.EMPTY_TITLE}
          text={text}
        />
      ) : (
        <EmptyState
          icon={PackageIcon}
          title={MANAGER_ORDERS_TEXTS.EMPTY_TAB_TITLE}
          text={MANAGER_ORDERS_TEXTS.EMPTY_TAB_TEXT}
        />
      )}
    </StateCard>
  );
}
