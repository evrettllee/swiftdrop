import { memo, useMemo } from 'react';
import type { BusinessAnalytics } from '@/shared/analytics-api';
import { formatWhole } from '@/shared/lib/format';
import { HorizontalBars, VerticalBarChart } from '@/shared/ui/analytics';
import { Panel } from '@/shared/ui/panel';
import { BUSINESS_TEXTS } from '../config/tab-texts';
import { buildBusinessTabView } from '../lib/business-view';
import { KpiGrid } from './KpiGrid';

type BusinessTabProps = {
  data: BusinessAnalytics;
  isWeekPreset: boolean;
  isDesktop: boolean;
};

export const BusinessTab = memo(function BusinessTab({
  data,
  isWeekPreset,
  isDesktop,
}: BusinessTabProps) {
  const view = useMemo(() => buildBusinessTabView(data, isWeekPreset), [data, isWeekPreset]);

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <KpiGrid items={view.kpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title={BUSINESS_TEXTS.FUNNEL_TITLE} description={BUSINESS_TEXTS.FUNNEL_SUBTITLE}>
          <HorizontalBars items={view.funnel} trackSize="lg" />
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <span className="text-caption font-semibold tracking-caps text-fg-secondary uppercase">
              {BUSINESS_TEXTS.LOSSES_TITLE}
            </span>
            {view.losses.map((loss) => (
              <div key={loss.key} className="flex items-baseline justify-between gap-4 text-small">
                <span className="text-fg-secondary">{loss.label}</span>
                <span className="font-semibold text-fg tabular-nums">
                  {formatWhole(loss.count)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={BUSINESS_TEXTS.REVENUE_TITLE} description={BUSINESS_TEXTS.REVENUE_SUBTITLE}>
          <VerticalBarChart
            items={view.revenueBars}
            ariaLabel={view.revenueAriaLabel}
            isDesktop={isDesktop}
          />
        </Panel>
      </div>
    </div>
  );
});
