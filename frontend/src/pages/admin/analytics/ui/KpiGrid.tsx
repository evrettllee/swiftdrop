import { StatCard } from '@/shared/ui/analytics';
import { ADMIN_ANALYTICS_TEXTS as TEXTS } from '../config/texts';
import type { KpiCardView } from '../lib/business-view';

type KpiGridProps = {
  items: readonly KpiCardView[];
};

export function KpiGrid({ items }: KpiGridProps) {
  return (
    <section
      aria-label={TEXTS.KPIS_LABEL}
      className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6"
    >
      {items.map((item) => (
        <StatCard key={item.key} label={item.label} value={item.value} change={item.change} />
      ))}
    </section>
  );
}
