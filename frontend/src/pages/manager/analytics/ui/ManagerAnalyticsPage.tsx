import { ANALYTICS_DEFAULT_COURIER_SORT } from '@/shared/analytics-api';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { useMediaQuery } from '@/shared/lib/dom';
import { APP_ROUTES } from '@/shared/routes';
import { TextLink } from '@/shared/ui/text-link';
import { MANAGER_ANALYTICS_TEXTS as TEXTS } from '../config/texts';
import { summaryLine } from '../lib/period';
import { useAnalyticsPage } from '../model/useAnalyticsPage';
import { AnalyticsCharts } from './AnalyticsCharts';
import { AnalyticsHeader } from './AnalyticsHeader';
import { CouriersView } from './CouriersView';
import { KpiGrid } from './KpiGrid';
import { LoadFailure } from './LoadFailure';

function withSearch(path: string, search: string): string {
  return search === '' ? path : `${path}?${search}`;
}

export function ManagerAnalyticsPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const { period, summary, couriers } = useAnalyticsPage();
  const data = summary.data;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <AnalyticsHeader
        title={TEXTS.TITLE}
        period={period}
        line={data === null ? null : summaryLine(data.period)}
        isLoading={summary.isLoading}
      />
      {summary.failure === null ? (
        <>
          <KpiGrid kpis={data?.kpis ?? null} />
          <AnalyticsCharts summary={data} isDesktop={isDesktop} />
        </>
      ) : (
        <LoadFailure message={summary.failure} onRetry={summary.retry} />
      )}
      <section aria-labelledby="analytics-couriers" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="analytics-couriers" className="text-heading-sm font-semibold">
            {TEXTS.COURIERS_TITLE}
          </h2>
          <TextLink
            variant="standalone"
            to={withSearch(APP_ROUTES.MANAGER_ANALYTICS_COURIERS, period.search)}
          >
            {TEXTS.ALL_COURIERS}
          </TextLink>
        </div>
        <CouriersView
          request={couriers}
          isDesktop={isDesktop}
          sort={ANALYTICS_DEFAULT_COURIER_SORT}
        />
      </section>
    </div>
  );
}
