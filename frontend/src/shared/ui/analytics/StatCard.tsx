import { ArrowDownIcon, ArrowUpIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { Skeleton } from '@/shared/ui/skeleton';

export type KpiTone = 'positive' | 'negative' | 'neutral';
export type KpiDirection = 'up' | 'down';

export type KpiChange = {
  direction?: KpiDirection;
  tone: KpiTone;
  text: string;
};

type StatCardProps = {
  label: string;
  value: string;
  change: KpiChange | null;
};

const TONE_CLASSES: Record<KpiTone, string> = {
  positive: 'text-success',
  negative: 'text-danger',
  neutral: 'text-fg-secondary',
};

export function StatCard({ label, value, change }: StatCardProps) {
  const DirectionIcon =
    change?.direction === 'up' ? ArrowUpIcon : change?.direction === 'down' ? ArrowDownIcon : null;

  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg bg-surface p-4 shadow-md dark:border dark:border-border">
      <span className="text-small text-fg-secondary">{label}</span>
      <span className="text-heading-md font-bold text-fg tabular-nums lg:text-heading-lg">
        {value}
      </span>
      {change === null ? null : (
        <span
          className={`inline-flex items-center gap-1 text-caption tabular-nums ${TONE_CLASSES[change.tone]}`}
        >
          {DirectionIcon === null ? null : (
            <DirectionIcon
              size={ICON_SIZE.SMALL}
              weight={ICON_WEIGHT}
              aria-hidden="true"
              className="shrink-0"
            />
          )}
          <span>{change.text}</span>
        </span>
      )}
    </div>
  );
}

export function StatGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-lg bg-surface p-4 shadow-md dark:border dark:border-border"
        >
          <Skeleton className="h-4 w-28 rounded-sm" />
          <Skeleton className="h-8 w-24 rounded-sm lg:h-9" />
          <Skeleton className="h-4 w-36 rounded-sm" />
        </div>
      ))}
    </div>
  );
}
