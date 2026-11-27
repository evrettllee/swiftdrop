import { memo, useMemo } from 'react';
import type { UsersAnalytics } from '@/shared/analytics-api';
import { HorizontalBars, VerticalBarChart } from '@/shared/ui/analytics';
import { Panel } from '@/shared/ui/panel';
import { USERS_TEXTS } from '../config/tab-texts';
import { buildUsersTabView } from '../lib/users-view';
import { KpiGrid } from './KpiGrid';

type UsersTabProps = {
  data: UsersAnalytics;
  isWeekPreset: boolean;
  isDesktop: boolean;
};

export const UsersTab = memo(function UsersTab({ data, isWeekPreset, isDesktop }: UsersTabProps) {
  const view = useMemo(() => buildUsersTabView(data, isWeekPreset), [data, isWeekPreset]);

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <KpiGrid items={view.kpis} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title={USERS_TEXTS.CLIENTS_CHART_TITLE}
          description={USERS_TEXTS.CLIENTS_CHART_SUBTITLE}
        >
          <VerticalBarChart
            items={view.clientsBars}
            ariaLabel={USERS_TEXTS.CLIENTS_CHART_TITLE}
            isDesktop={isDesktop}
          />
        </Panel>
        <Panel
          title={USERS_TEXTS.ORDERS_PER_CLIENT_TITLE}
          description={view.ordersPerClientSubtitle}
        >
          <HorizontalBars items={view.ordersPerClient} trackSize="sm" />
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-4 text-small">
            <span className="text-fg-secondary">{view.repeatSummaryLabel}</span>
            <span className="font-semibold text-fg tabular-nums">{view.repeatSummaryValue}</span>
          </div>
        </Panel>
      </div>
    </div>
  );
});
