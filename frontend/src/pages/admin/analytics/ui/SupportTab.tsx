import { memo, useMemo } from 'react';
import type { SupportAnalytics } from '@/shared/analytics-api';
import { HorizontalBars, VerticalBarChart } from '@/shared/ui/analytics';
import { Panel } from '@/shared/ui/panel';
import { SUPPORT_TEXTS } from '../config/tab-texts';
import { buildSupportTabView } from '../lib/support-view';
import { KpiGrid } from './KpiGrid';

type SupportTabProps = {
  data: SupportAnalytics;
  isDesktop: boolean;
};

export const SupportTab = memo(function SupportTab({ data, isDesktop }: SupportTabProps) {
  const view = useMemo(() => buildSupportTabView(data), [data]);

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <KpiGrid items={view.kpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title={SUPPORT_TEXTS.TOPICS_TITLE} description={view.topicsSubtitle}>
          <HorizontalBars items={view.topics} trackSize="sm" />
        </Panel>
        <Panel title={SUPPORT_TEXTS.RESPONSE_TITLE} description={SUPPORT_TEXTS.RESPONSE_SUBTITLE}>
          <VerticalBarChart
            items={view.responseBars}
            ariaLabel={SUPPORT_TEXTS.RESPONSE_TITLE}
            isDesktop={isDesktop}
          />
        </Panel>
      </div>
    </div>
  );
});
