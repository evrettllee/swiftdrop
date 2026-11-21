import { TagIcon, WarningCircleIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Skeleton } from '@/shared/ui/skeleton';
import { ADMIN_TARIFFS_TEXTS as TEXTS } from '../config/texts';

const SKELETON_ROWS = 5;

export function TariffsSkeleton() {
  return (
    <div
      role="status"
      aria-label={TEXTS.TABLE_LABEL}
      className="rounded-lg bg-surface shadow-md dark:border dark:border-border"
    >
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-5 w-40 rounded-sm" />
            <Skeleton className="h-5 grow rounded-sm" />
            <Skeleton className="hidden h-5 w-32 rounded-sm lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TariffsFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg bg-surface shadow-md dark:border dark:border-border">
      <EmptyState
        icon={WarningCircleIcon}
        title={TEXTS.LIST_FAILED_TITLE}
        text={TEXTS.LIST_FAILED}
      >
        <Button variant="secondary" onClick={onRetry}>
          {TEXTS.RETRY}
        </Button>
      </EmptyState>
    </div>
  );
}

export function TariffsEmpty({ action }: { action: ReactNode }) {
  return (
    <div className="rounded-lg bg-surface shadow-md dark:border dark:border-border">
      <EmptyState icon={TagIcon} title={TEXTS.EMPTY_TITLE} text={TEXTS.EMPTY_TEXT}>
        {action}
      </EmptyState>
    </div>
  );
}
