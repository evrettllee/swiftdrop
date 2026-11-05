import type { CourierHistorySummary } from '@/shared/api';
import type { Period } from '@/shared/lib/calendar';
import { summaryLine } from '../lib/summary-line';

type HistorySummaryProps = {
  period: Period;
  summary: CourierHistorySummary | null;
  now: Date;
};

export function HistorySummary({ period, summary, now }: HistorySummaryProps) {
  const line = summaryLine(period, summary, now);

  if (line === null) {
    return null;
  }

  return (
    <p className="text-small text-fg-secondary tabular-nums">
      {line.lead}
      <span className="font-semibold text-fg">{line.count}</span>,{' '}
      <span className="font-semibold text-fg">{line.distance}</span>
    </p>
  );
}
