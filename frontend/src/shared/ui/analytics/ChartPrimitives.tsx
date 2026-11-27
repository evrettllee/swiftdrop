import type { ReactNode } from 'react';
import { formatDecimal } from '@/shared/lib/format';
import type { TooltipAlign } from './chart-helpers';

const ALIGN_CLASSES: Record<TooltipAlign, string> = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
};

type ChartTooltipProps = {
  title: string;
  subtitle?: string;
  align?: TooltipAlign;
};

export function ChartTooltip({ title, subtitle, align = 'center' }: ChartTooltipProps) {
  return (
    <span
      className={`pointer-events-none absolute bottom-[calc(100%+8px)] z-10 flex flex-col gap-0.5 rounded-md border border-border-elevated bg-surface-elevated px-3 py-2 text-caption whitespace-nowrap text-fg tabular-nums shadow-lg ${ALIGN_CLASSES[align]}`}
    >
      <b className="text-small font-semibold">{title}</b>
      {subtitle === undefined ? null : <span className="text-fg-secondary">{subtitle}</span>}
    </span>
  );
}

type ChartYAxisProps = {
  ticks: readonly number[];
  suffix?: string;
};

export function ChartYAxis({ ticks, suffix = '' }: ChartYAxisProps) {
  const ordered = [...ticks].reverse();
  const lastIndex = Math.max(1, ordered.length - 1);

  return (
    <div
      aria-hidden="true"
      className="relative h-60 text-caption leading-none text-fg-secondary tabular-nums"
    >
      {ordered.map((tick, index) => (
        <span
          key={tick}
          style={{ top: `${(index / lastIndex) * 100}%` }}
          className="absolute right-0 -translate-y-1/2"
        >
          {`${formatDecimal(tick)}${suffix}`}
        </span>
      ))}
    </div>
  );
}

type ChartXAxisProps = {
  labels: readonly string[];
  step: number;
};

export function ChartXAxis({ labels, step }: ChartXAxisProps) {
  return (
    <div
      aria-hidden="true"
      className="col-start-2 flex gap-1.5 text-caption text-fg-secondary tabular-nums lg:gap-3"
    >
      {labels.map((label, index) => (
        <span key={index} className="min-w-0 flex-1 text-center whitespace-nowrap">
          {index % step === 0 || index === labels.length - 1 ? label : ''}
        </span>
      ))}
    </div>
  );
}

type ChartFigureProps = {
  label: string;
  ticks: readonly number[];
  yAxisSuffix?: string;
  xLabels: readonly string[];
  xStep: number;
  children: ReactNode;
};

export function ChartFigure({
  label,
  ticks,
  yAxisSuffix,
  xLabels,
  xStep,
  children,
}: ChartFigureProps) {
  return (
    <figure
      role="img"
      aria-label={label}
      className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 lg:grid-cols-[2.5rem_minmax(0,1fr)]"
    >
      <ChartYAxis ticks={ticks} suffix={yAxisSuffix} />
      {children}
      <ChartXAxis labels={xLabels} step={xStep} />
    </figure>
  );
}
