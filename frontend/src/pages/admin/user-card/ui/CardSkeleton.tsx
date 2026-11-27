import { Skeleton } from '@/shared/ui/skeleton';

const PANEL_CLASS =
  'flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-md lg:p-6 dark:border dark:border-border';
const FACT_ROWS = 5;
const ACTION_ROWS = 4;

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <div className={PANEL_CLASS}>
      <Skeleton className="h-6 w-32 rounded-sm" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-5 w-full rounded-sm" />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4 lg:gap-6">
      <Skeleton className="h-5 w-64 rounded-sm" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56 rounded-sm" />
          <Skeleton className="h-6 w-40 rounded-sm" />
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_22.5rem] lg:items-start lg:gap-6">
        <PanelSkeleton rows={FACT_ROWS} />
        <PanelSkeleton rows={ACTION_ROWS} />
      </div>
    </div>
  );
}
