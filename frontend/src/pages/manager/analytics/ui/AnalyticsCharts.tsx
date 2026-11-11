import type { AnalyticsSummary } from '@/shared/analytics-api';
import { Skeleton } from '@/shared/ui/skeleton';
import { CHART_TEXTS } from '../config/texts';
import { dayBars, hourBars } from '../lib/chart-bars';
import { daysSummary } from '../lib/days';
import { hoursSummary, hoursWindow } from '../lib/hours';
import { formatFine } from '../lib/numbers';
import { BarChart } from './BarChart';

const PANEL_CLASS =
  'flex min-w-0 flex-col gap-4 rounded-lg bg-surface p-4 shadow-md lg:p-6 dark:border dark:border-border';

const LEGEND = [
  { label: CHART_TEXTS.DELIVERED, className: 'bg-accent' },
  { label: CHART_TEXTS.CANCELLED, className: 'bg-danger' },
  {
    label: CHART_TEXTS.IN_PROGRESS,
    className: 'border-[1.5px] border-dashed border-accent bg-selected',
  },
] as const;

function Legend() {
  return (
    <ul className="flex flex-wrap gap-4 text-caption text-fg-secondary">
      {LEGEND.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-2">
          <span aria-hidden="true" className={`size-3 shrink-0 rounded-sm ${item.className}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6" aria-hidden="true">
      {[CHART_TEXTS.DAYS, CHART_TEXTS.HOURS].map((title) => (
        <div key={title} className={PANEL_CLASS}>
          <Skeleton className="h-6 w-40 rounded-sm" />
          <Skeleton className="h-4 w-56 rounded-sm" />
          <Skeleton className="h-60 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

type AnalyticsChartsProps = {
  summary: AnalyticsSummary | null;
  isDesktop: boolean;
};

export function AnalyticsCharts({ summary, isDesktop }: AnalyticsChartsProps) {
  if (summary === null) {
    return <ChartsSkeleton />;
  }

  const hours = hoursWindow(summary.hours);

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <section aria-labelledby="analytics-days" className={PANEL_CLASS}>
        <div className="flex flex-col gap-2 lg:gap-1">
          <h2 id="analytics-days" className="text-heading-sm font-semibold">
            {CHART_TEXTS.DAYS}
          </h2>
          <Legend />
        </div>
        <BarChart
          label={daysSummary(summary.days)}
          bars={dayBars(summary.days, isDesktop)}
          formatTick={formatFine}
          showValues
        />
      </section>
      <section aria-labelledby="analytics-hours" className={PANEL_CLASS}>
        <div className="flex flex-col gap-1">
          <h2 id="analytics-hours" className="text-heading-sm font-semibold">
            {CHART_TEXTS.HOURS}
          </h2>
          <p className="text-caption text-fg-secondary">{CHART_TEXTS.HOURS_NOTE}</p>
        </div>
        <BarChart
          label={hoursSummary(hours)}
          bars={hourBars(hours, isDesktop)}
          formatTick={formatFine}
        />
      </section>
    </div>
  );
}
