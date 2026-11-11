import type { AnalyticsKpis } from '@/shared/analytics-api';
import { Skeleton } from '@/shared/ui/skeleton';
import { MANAGER_ANALYTICS_TEXTS as TEXTS } from '../config/texts';
import { kpiCards } from '../lib/kpi-cards';

const GRID_CLASS = 'grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6';
const CARD_CLASS =
  'flex min-w-0 flex-col gap-1 rounded-lg bg-surface p-4 shadow-md dark:border dark:border-border';
const SKELETON_CARDS = 6;

function KpiSkeleton() {
  return (
    <div className={GRID_CLASS} aria-hidden="true">
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <div key={index} className={CARD_CLASS}>
          <Skeleton className="h-5 w-24 rounded-sm" />
          <Skeleton className="my-1 h-8 w-20 rounded-sm lg:h-9 lg:w-28" />
          <Skeleton className="h-4 w-full max-w-56 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

type KpiGridProps = {
  kpis: AnalyticsKpis | null;
};

export function KpiGrid({ kpis }: KpiGridProps) {
  if (kpis === null) {
    return <KpiSkeleton />;
  }

  return (
    <section aria-label={TEXTS.KPIS} className={GRID_CLASS}>
      {kpiCards(kpis).map((card) => (
        <div key={card.id} data-kpi={card.id} className={CARD_CLASS}>
          <h2 className="text-small text-fg-secondary">
            <span className="lg:hidden">{card.shortTitle}</span>
            <span className="hidden lg:inline">{card.title}</span>
          </h2>
          <p className="text-heading-md font-bold tabular-nums lg:text-heading-lg">
            <span className="lg:hidden">{card.shortValue}</span>
            <span className="hidden lg:inline">{card.value}</span>
          </p>
          <p className="text-caption text-pretty text-fg-secondary tabular-nums">
            <span className="lg:hidden">{card.shortNote}</span>
            <span className="hidden lg:inline">{card.note}</span>
          </p>
        </div>
      ))}
    </section>
  );
}
