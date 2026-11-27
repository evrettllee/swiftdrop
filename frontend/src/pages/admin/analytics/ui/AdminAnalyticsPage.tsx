import { useState } from 'react';
import { AnalyticsExportButton, AnalyticsExportDialog } from '@/features/analytics-export';
import { AnalyticsPeriodControl, PERIOD_TEXTS } from '@/features/analytics-period';
import { ANALYTICS_EXPORT_ROLE } from '@/shared/analytics-api';
import { DESKTOP_MEDIA_QUERY } from '@/shared/config';
import { formatDateRange, previousPeriodDates } from '@/shared/lib/calendar';
import { useMediaQuery } from '@/shared/lib/dom';
import { LoadFailure } from '@/shared/ui/analytics';
import { PageTitle } from '@/shared/ui/page-title';
import { Skeleton } from '@/shared/ui/skeleton';
import { TabPanel, Tabs } from '@/shared/ui/tabs';
import { ADMIN_ANALYTICS_TAB, ADMIN_ANALYTICS_TABS_LIST } from '../config/tabs';
import { ADMIN_ANALYTICS_TAB_LABELS, ADMIN_ANALYTICS_TEXTS as TEXTS } from '../config/texts';
import { type AdminAnalyticsLoaded, useAdminAnalytics } from '../model/useAdminAnalytics';
import { AnalyticsTabSkeleton } from './AnalyticsTabSkeleton';
import { BusinessTab } from './BusinessTab';
import { DeliveryTab } from './DeliveryTab';
import { ServiceTab } from './ServiceTab';
import { SupportTab } from './SupportTab';
import { UsersTab } from './UsersTab';

const TABS_ID_PREFIX = 'admin-analytics';

function comparisonText(dates: { from: string; to: string } | null): string | null {
  if (dates === null) {
    return null;
  }

  const prev = previousPeriodDates(dates.from, dates.to);

  return PERIOD_TEXTS.comparisonLine(
    formatDateRange(dates.from, dates.to),
    formatDateRange(prev.from, prev.to),
  );
}

function renderActiveContent(loaded: AdminAnalyticsLoaded, isDesktop: boolean) {
  switch (loaded.tab) {
    case ADMIN_ANALYTICS_TAB.BUSINESS:
      return <BusinessTab data={loaded.data} isWeekPreset={loaded.isWeek} isDesktop={isDesktop} />;
    case ADMIN_ANALYTICS_TAB.DELIVERY:
      return <DeliveryTab data={loaded.data} isDesktop={isDesktop} />;
    case ADMIN_ANALYTICS_TAB.USERS:
      return <UsersTab data={loaded.data} isWeekPreset={loaded.isWeek} isDesktop={isDesktop} />;
    case ADMIN_ANALYTICS_TAB.SUPPORT:
      return <SupportTab data={loaded.data} isDesktop={isDesktop} />;
    case ADMIN_ANALYTICS_TAB.SERVICE:
      return <ServiceTab data={loaded.data} isDesktop={isDesktop} />;
  }
}

export function AdminAnalyticsPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const analytics = useAdminAnalytics();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportPeriod = analytics.loaded?.data.period ?? analytics.period.request?.query ?? null;
  const subtitle = comparisonText(exportPeriod);
  const tabItems = ADMIN_ANALYTICS_TABS_LIST.map((id) => ({
    id,
    label: ADMIN_ANALYTICS_TAB_LABELS[id],
  }));

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <PageTitle>{TEXTS.TITLE}</PageTitle>
          {subtitle !== null ? (
            <p className="text-small text-fg-secondary tabular-nums">{subtitle}</p>
          ) : analytics.isLoading ? (
            <Skeleton className="h-5 w-64 rounded-sm" />
          ) : null}
        </div>
        <AnalyticsPeriodControl
          period={analytics.period}
          action={
            <AnalyticsExportButton
              disabled={exportPeriod === null}
              onClick={() => setIsExportOpen(true)}
            />
          }
        />
      </header>

      <Tabs
        layout="fit"
        tabs={tabItems}
        value={analytics.tab}
        onChange={analytics.setTab}
        label={TEXTS.TABS_LABEL}
        idPrefix={TABS_ID_PREFIX}
      />

      {ADMIN_ANALYTICS_TABS_LIST.map((tabId) => (
        <TabPanel key={tabId} id={tabId} activeId={analytics.tab} idPrefix={TABS_ID_PREFIX}>
          {analytics.failure !== null ? (
            <LoadFailure message={analytics.failure} onRetry={analytics.retry} />
          ) : analytics.loaded !== null && analytics.loaded.tab === tabId ? (
            renderActiveContent(analytics.loaded, isDesktop)
          ) : (
            <AnalyticsTabSkeleton />
          )}
        </TabPanel>
      ))}

      <AnalyticsExportDialog
        role={ANALYTICS_EXPORT_ROLE.ADMIN}
        period={exportPeriod}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
