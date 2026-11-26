import { useState } from 'react';
import {
  buildLinePaths,
  labelStep,
  type LinePoint,
  type LinePointBase,
  percentLineScale,
  toLinePoints,
  tooltipAlignFor,
} from './chart-helpers';
import { ChartFigure, ChartTooltip } from './ChartPrimitives';

const VIEWBOX_WIDTH = 600;
const VIEWBOX_HEIGHT = 240;
const INTERVALS = 4;
const DESKTOP_LABELS_MAX = 8;
const PHONE_LABELS_MAX = 6;
const GRID_RATIOS = [0, 0.25, 0.5, 0.75, 1] as const;

export type LineChartDatum = LinePointBase;

type LineChartProps = {
  items: readonly LineChartDatum[];
  ariaLabel: string;
  isDesktop: boolean;
  emptyText: string;
};

function LineDot({
  point,
  count,
  isActive,
  onEnter,
  onLeave,
}: {
  point: LinePoint;
  count: number;
  isActive: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      style={{ left: `${point.xPct}%`, top: `${point.yPct}%` }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
    >
      <button
        type="button"
        tabIndex={0}
        aria-label={`${point.tooltipTitle}${point.tooltipSubtitle ? `, ${point.tooltipSubtitle}` : ''}`}
        className={`block size-3 rounded-full border-2 border-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          isActive ? 'bg-primary' : 'bg-accent'
        }`}
      />
      {isActive ? (
        <ChartTooltip
          title={point.tooltipTitle}
          subtitle={point.tooltipSubtitle}
          align={tooltipAlignFor(point.index, count)}
        />
      ) : null}
    </div>
  );
}

export function LineChart({ items, ariaLabel, isDesktop, emptyText }: LineChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const numericValues = items.flatMap((item) => (item.value === null ? [] : [item.value]));
  const scale = percentLineScale(
    numericValues.length > 0 ? Math.min(...numericValues) : null,
    INTERVALS,
  );
  const points = toLinePoints(items, scale.bottom, scale.top);
  const { line, area } = buildLinePaths(points);
  const step = labelStep(items.length, isDesktop ? DESKTOP_LABELS_MAX : PHONE_LABELS_MAX);

  if (points.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center rounded-md border border-dashed border-border text-small text-fg-secondary">
        {emptyText}
      </div>
    );
  }

  return (
    <ChartFigure
      label={ariaLabel}
      ticks={scale.ticks}
      xLabels={items.map((item) => item.xLabel)}
      xStep={step}
    >
      <div aria-hidden="true" className="relative h-60">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="none"
          className="block h-60 w-full overflow-visible"
        >
          <path
            d={GRID_RATIOS.map((ratio) => `M0 ${ratio * VIEWBOX_HEIGHT}H${VIEWBOX_WIDTH}`).join('')}
            className="stroke-border stroke-1"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
          <path d={area} className="fill-accent/10" />
          <path
            d={line}
            fill="none"
            className="stroke-accent stroke-2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div className="absolute inset-0">
          {points.map((point) => (
            <LineDot
              key={point.key}
              point={point}
              count={items.length}
              isActive={activeIndex === point.index}
              onEnter={() => setActiveIndex(point.index)}
              onLeave={() =>
                setActiveIndex((current) => (current === point.index ? null : current))
              }
            />
          ))}
        </div>
      </div>
    </ChartFigure>
  );
}
