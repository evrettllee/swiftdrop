import type { CSSProperties } from 'react';
import { formatCount } from '@/shared/lib/format';
import { CHART } from '../config/analytics';
import type { BarData as ChartBar, BarSegmentKind as SegmentKind } from '../lib/chart-bars';
import { barShare, niceScale } from '../lib/scale';
import { useBarFocus } from '../model/useBarFocus';
import { ChartTooltip, YAxis } from './ChartParts';

const PERCENT = 100;
const GAP_STEPS = [
  [7, 'gap-1.5 lg:gap-3'],
  [15, 'gap-1'],
  [31, 'gap-0.5'],
] as const;

const SEGMENT_CLASSES: Record<SegmentKind, string> = {
  delivered: 'bg-accent',
  cancelled: 'bg-danger',
  progress: 'border-[1.5px] border-b-0 border-dashed border-accent bg-selected',
};

const GRID_STYLE: CSSProperties = {
  backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px)',
  backgroundSize: '100% 60px',
};

function gapClass(count: number): string {
  return GAP_STEPS.find(([max]) => count <= max)?.[1] ?? 'gap-px';
}

function Bar({ bar, top, showValue }: { bar: ChartBar; top: number; showValue: boolean }) {
  const shown = bar.segments.filter((segment) => segment.value > 0);

  return (
    <div
      className="relative flex w-full flex-col-reverse"
      style={{ height: `${barShare(bar.total, top) * PERCENT}%` }}
    >
      {shown.map((segment, index) => (
        <span
          key={segment.kind}
          data-segment={segment.kind}
          className={`block ${SEGMENT_CLASSES[segment.kind]} ${index === shown.length - 1 ? 'rounded-t-sm' : ''}`}
          style={{ height: `${(segment.value / bar.total) * PERCENT}%` }}
        />
      ))}
      {showValue && bar.total > 0 ? (
        <span
          aria-hidden="true"
          className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 text-caption whitespace-nowrap text-fg tabular-nums"
        >
          {formatCount(bar.total)}
        </span>
      ) : null}
    </div>
  );
}

type BarChartProps = {
  label: string;
  bars: readonly ChartBar[];
  formatTick: (value: number) => string;
  showValues?: boolean;
};

export function BarChart({ label, bars, formatTick, showValues = false }: BarChartProps) {
  const { ticks, top } = niceScale(Math.max(0, ...bars.map((bar) => bar.total)), CHART.INTERVALS);
  const focus = useBarFocus(bars.length);
  const gap = gapClass(bars.length);
  const isValueShown = showValues && bars.length <= CHART.BAR_VALUES_MAX;
  const activeBar = focus.active === null ? null : bars[focus.active];

  return (
    <figure
      aria-label={label}
      className="m-0 grid grid-cols-[2rem_minmax(0,1fr)] gap-2 lg:grid-cols-[2.5rem_minmax(0,1fr)]"
    >
      <YAxis ticks={ticks} format={formatTick} />
      <div
        className={`relative flex h-60 items-end border-b border-border ${gap}`}
        style={GRID_STYLE}
        onKeyDown={focus.onKeyDown}
      >
        {bars.map((bar, index) => (
          <div
            key={bar.key}
            role="img"
            aria-label={bar.text}
            className="flex h-full min-w-0 flex-1 items-end rounded-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent"
            {...focus.barProps(index)}
          >
            <Bar bar={bar} top={top} showValue={isValueShown} />
          </div>
        ))}
        {activeBar === null || focus.active === null ? null : (
          <ChartTooltip
            tip={activeBar.tip}
            index={focus.active}
            count={bars.length}
            height={barShare(activeBar.total, top)}
          />
        )}
      </div>
      <div
        aria-hidden="true"
        className={`col-start-2 flex text-caption text-fg-secondary tabular-nums ${gap}`}
      >
        {bars.map((bar) => (
          <span key={bar.key} className="min-w-0 flex-1 text-center whitespace-nowrap">
            {bar.axisLabel}
          </span>
        ))}
      </div>
    </figure>
  );
}
