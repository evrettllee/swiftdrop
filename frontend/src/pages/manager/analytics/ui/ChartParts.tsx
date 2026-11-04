import type { CSSProperties } from 'react';
import { barShare } from '../lib/scale';

export type ChartTip = { title: string; lines: readonly string[] };

const EDGE_SHARE = 0.25;
const PERCENT = 100;

type YAxisProps = {
  ticks: readonly number[];
  format: (value: number) => string;
};

export function YAxis({ ticks, format }: YAxisProps) {
  const top = ticks.at(-1) ?? 0;

  return (
    <div aria-hidden="true" className="relative h-60 text-caption text-fg-secondary tabular-nums">
      {ticks.map((tick) => (
        <span
          key={tick}
          className="absolute end-0 translate-y-1/2 leading-none"
          style={{ bottom: `${barShare(tick, top) * PERCENT}%` }}
        >
          {format(tick)}
        </span>
      ))}
    </div>
  );
}

type ChartTooltipProps = {
  tip: ChartTip;
  index: number;
  count: number;
  height: number;
};

function placement(center: number): { style: CSSProperties; className: string } {
  if (center < EDGE_SHARE) {
    return { style: { left: `${center * PERCENT}%` }, className: '' };
  }

  if (center > 1 - EDGE_SHARE) {
    return { style: { right: `${(1 - center) * PERCENT}%` }, className: '' };
  }

  return { style: { left: `${center * PERCENT}%` }, className: '-translate-x-1/2' };
}

export function ChartTooltip({ tip, index, count, height }: ChartTooltipProps) {
  const { style, className } = placement((index + 1 / 2) / count);

  return (
    <div
      aria-hidden="true"
      data-chart-tip=""
      className={`pointer-events-none absolute z-10 flex w-max max-w-48 flex-col gap-0.5 rounded-md border border-border bg-surface-elevated px-3 py-2 text-caption shadow-lg ${className}`}
      style={{ ...style, bottom: `calc(${height * PERCENT}% + 0.5rem)` }}
    >
      <span className="font-semibold text-fg">{tip.title}</span>
      {tip.lines.map((line) => (
        <span key={line} className="text-fg-secondary tabular-nums">
          {line}
        </span>
      ))}
    </div>
  );
}
