import type { ReactNode } from 'react';
import type { AnalyticsCourier, AnalyticsCourierSort } from '@/shared/analytics-api';
import { Skeleton } from '@/shared/ui/skeleton';
import { MANAGER_ANALYTICS_TEXTS as TEXTS } from '../config/texts';
import { courierRow } from '../lib/courier-row';
import type { AnalyticsRequest } from '../model/useAnalyticsRequest';
import { CourierCards } from './CourierCards';
import { CouriersTable } from './CouriersTable';
import { LoadFailure } from './LoadFailure';

const SKELETON_ROWS = 5;

type CouriersViewProps = {
  request: AnalyticsRequest<{ items: AnalyticsCourier[] }>;
  isDesktop: boolean;
  sort: AnalyticsCourierSort;
  onSort?: (sort: AnalyticsCourierSort) => void;
  footer?: ReactNode;
};

export function CouriersView({ request, isDesktop, sort, onSort, footer }: CouriersViewProps) {
  if (request.failure !== null) {
    return <LoadFailure message={request.failure} onRetry={request.retry} />;
  }

  if (request.data === null) {
    return (
      <div className="flex flex-col gap-3" aria-hidden="true">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (request.data.items.length === 0) {
    return (
      <p className="rounded-lg bg-surface p-6 text-center text-fg-secondary shadow-md dark:border dark:border-border">
        {TEXTS.NO_COURIERS}
      </p>
    );
  }

  const rows = request.data.items.map(courierRow);

  return isDesktop ? (
    <CouriersTable rows={rows} sort={sort} onSort={onSort} footer={footer} />
  ) : (
    <CourierCards rows={rows} footer={footer} />
  );
}
