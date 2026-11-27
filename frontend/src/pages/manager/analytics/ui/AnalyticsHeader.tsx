import type { ReactNode } from 'react';
import {
  AnalyticsPeriodControl,
  type AnalyticsPeriodControlState,
} from '@/features/analytics-period';
import { PageTitle } from '@/shared/ui/page-title';
import { Skeleton } from '@/shared/ui/skeleton';

type AnalyticsHeaderProps = {
  title: string;
  period: AnalyticsPeriodControlState;
  line: string | null;
  isLoading: boolean;
  before?: ReactNode;
  action?: ReactNode;
};

export function AnalyticsHeader({
  title,
  period,
  line,
  isLoading,
  before,
  action,
}: AnalyticsHeaderProps) {
  let shown: ReactNode = null;

  if (line !== null) {
    shown = <p className="text-small text-fg-secondary tabular-nums">{line}</p>;
  } else if (isLoading) {
    shown = <Skeleton className="h-5 w-64 rounded-sm" />;
  }

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-col gap-1">
        {before}
        <PageTitle>{title}</PageTitle>
        {shown}
      </div>
      <AnalyticsPeriodControl period={period} action={action} />
    </header>
  );
}
