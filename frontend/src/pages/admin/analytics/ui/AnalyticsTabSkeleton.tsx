import { StatGridSkeleton } from '@/shared/ui/analytics';
import { Skeleton } from '@/shared/ui/skeleton';

const KPI_COUNT = 4;

export function AnalyticsTabSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <StatGridSkeleton count={KPI_COUNT} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg bg-surface p-4 shadow-md lg:p-6 dark:border dark:border-border">
          <Skeleton className="h-5 w-48 rounded-sm" />
          <Skeleton className="h-60 w-full rounded-md" />
        </div>
        <div className="flex flex-col gap-4 rounded-lg bg-surface p-4 shadow-md lg:p-6 dark:border dark:border-border">
          <Skeleton className="h-5 w-48 rounded-sm" />
          <Skeleton className="h-60 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
