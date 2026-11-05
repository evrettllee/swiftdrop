import type { Period } from '@/shared/lib/calendar';
import { PeriodControl as SharedPeriodControl } from '@/shared/ui/period-picker';
import type { OrdersQuery } from '../api/list-orders';
import { FILTER_TEXTS } from '../config/texts';
import { periodButtonLabel } from '../lib/period-labels';
import { PeriodForm } from './PeriodForm';

type PeriodControlProps = {
  query: OrdersQuery;
  now: Date;
  isDesktop: boolean;
  onApply: (period: Period) => void;
};

export function PeriodControl({ query, now, isDesktop, onApply }: PeriodControlProps) {
  return (
    <SharedPeriodControl
      isDesktop={isDesktop}
      title={FILTER_TEXTS.PERIOD}
      label={periodButtonLabel(query, now, isDesktop)}
    >
      {(layout, close) => (
        <PeriodForm
          query={query}
          now={now}
          layout={layout}
          onApply={(period) => {
            onApply(period);
            close();
          }}
        />
      )}
    </SharedPeriodControl>
  );
}
