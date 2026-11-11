import {
  ANALYTICS_COURIER_SORTS,
  ANALYTICS_COURIERS_LIMIT,
  type AnalyticsCourierSort,
} from '@/shared/analytics-api';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { APP_ROUTES } from '@/shared/routes';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs';
import { Pagination } from '@/shared/ui/pagination';
import { Select } from '@/shared/ui/select';
import { COURIER_TEXTS, MANAGER_ANALYTICS_TEXTS as TEXTS, SORT_LABELS } from '../config/texts';
import { formatDateRange } from '../lib/period';
import { useCouriersPage } from '../model/useCouriersPage';
import { AnalyticsHeader } from './AnalyticsHeader';
import { CouriersView } from './CouriersView';

const SORT_OPTIONS: readonly { value: AnalyticsCourierSort; label: string }[] =
  ANALYTICS_COURIER_SORTS.map((sort) => ({ value: sort, label: SORT_LABELS[sort] }));

export function ManagerAnalyticsCouriersPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const page = useCouriersPage();
  const data = page.couriers.data;
  const search = page.period.search;
  const parentPath =
    search === '' ? APP_ROUTES.MANAGER_ANALYTICS : `${APP_ROUTES.MANAGER_ANALYTICS}?${search}`;

  const footer =
    data === null || data.total === 0 ? undefined : (
      <Pagination
        page={page.page}
        totalPages={Math.max(1, Math.ceil(data.total / ANALYTICS_COURIERS_LIMIT))}
        total={data.total}
        pageSize={ANALYTICS_COURIERS_LIMIT}
        onChange={page.setPage}
      />
    );

  return (
    <div className="flex flex-col gap-6">
      <AnalyticsHeader
        title={TEXTS.COURIERS_TITLE}
        period={page.period}
        line={data === null ? null : formatDateRange(data.period.from, data.period.to)}
        isLoading={page.couriers.isLoading}
        before={
          <Breadcrumbs
            label={TEXTS.BREADCRUMBS}
            parent={{ label: TEXTS.TITLE, to: parentPath }}
            current={TEXTS.COURIERS_TITLE}
          />
        }
      />
      {isDesktop ? null : (
        <Select
          label={COURIER_TEXTS.SORT}
          options={SORT_OPTIONS}
          value={page.sort}
          onChange={page.setSort}
        />
      )}
      <CouriersView
        request={page.couriers}
        isDesktop={isDesktop}
        sort={page.sort}
        onSort={page.setSort}
        footer={footer}
      />
    </div>
  );
}
