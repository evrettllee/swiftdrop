import type { CSSProperties } from 'react';

const GRID_HEIGHT_PX = 240;
const PERCENT = 100;
const NICE_STEPS = [1, 1.5, 2, 2.5, 5, 10] as const;
const PRECISION = 12;
const DECIMAL_BASE = 10;
const PERCENT_DEFAULT_BOTTOM = 80;
const PERCENT_STEP_BUCKET = 10;
const VIEWBOX_WIDTH = 600;
const VIEWBOX_HEIGHT = 240;

export type Scale = { top: number; ticks: number[] };
export type RangeScale = { bottom: number; top: number; ticks: number[] };
export type TooltipAlign = 'start' | 'center' | 'end';
export type LinePointBase = {
  key: string;
  xLabel: string;
  value: number | null;
  tooltipTitle: string;
  tooltipSubtitle?: string;
};
export type LinePoint = LinePointBase & { index: number; xPct: number; yPct: number };

export function tooltipAlignFor(index: number, count: number): TooltipAlign {
  if (count <= 2) {
    return 'center';
  }

  return index === 0 ? 'start' : index >= count - 1 ? 'end' : 'center';
}

export function gridStyle(intervals: number): CSSProperties {
  return {
    backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px)',
    backgroundSize: `100% ${GRID_HEIGHT_PX / intervals}px`,
  };
}

export function percentHeight(share: number): string {
  return `${Math.round(share * PERCENT * 10) / 10}%`;
}

export function niceScale(max: number, intervals: number): Scale {
  const raw = max / intervals;
  const power = DECIMAL_BASE ** Math.floor(Math.log10(raw));
  const step =
    max > 0
      ? Number(
          (
            NICE_STEPS.map((m) => m * power).find((candidate) => candidate >= raw) ?? raw
          ).toPrecision(PRECISION),
        )
      : 1;
  const ticks = Array.from({ length: intervals + 1 }, (_, index) =>
    Number((index * step).toPrecision(PRECISION)),
  );

  return { top: ticks[intervals], ticks };
}

export function percentLineScale(minValue: number | null, intervals: number): RangeScale {
  const rawBottom =
    minValue === null || minValue >= PERCENT_DEFAULT_BOTTOM
      ? PERCENT_DEFAULT_BOTTOM
      : Math.max(0, Math.floor(minValue / PERCENT_STEP_BUCKET) * PERCENT_STEP_BUCKET);
  const step = (PERCENT - rawBottom) / intervals;
  const ticks = Array.from({ length: intervals + 1 }, (_, index) =>
    Number((rawBottom + index * step).toPrecision(PRECISION)),
  );

  return { bottom: rawBottom, top: PERCENT, ticks };
}

export function labelStep(count: number, maxLabels: number): number {
  return Math.max(1, Math.ceil(count / maxLabels));
}

export function barShare(value: number, top: number): number {
  return top <= 0 ? 0 : Math.min(1, Math.max(0, value / top));
}

export function toLinePoints(
  items: readonly LinePointBase[],
  bottom: number,
  top: number,
): LinePoint[] {
  const span = Math.max(1, top - bottom);
  const count = Math.max(1, items.length);

  return items.flatMap((item, index) => {
    if (item.value === null) {
      return [];
    }

    const xPct = ((index + 0.5) / count) * PERCENT;
    const clamped = Math.min(top, Math.max(bottom, item.value));

    return [{ ...item, index, xPct, yPct: ((top - clamped) / span) * PERCENT }];
  });
}

export function buildLinePaths(points: readonly LinePoint[]): { line: string; area: string } {
  if (points.length === 0) {
    return { line: '', area: '' };
  }

  const coords = points.map(
    (point) =>
      `${((point.xPct / PERCENT) * VIEWBOX_WIDTH).toFixed(2)} ${((point.yPct / PERCENT) * VIEWBOX_HEIGHT).toFixed(2)}`,
  );
  const line = `M${coords.join(' L')}`;
  const firstX = ((points[0].xPct / PERCENT) * VIEWBOX_WIDTH).toFixed(2);
  const lastX = ((points[points.length - 1].xPct / PERCENT) * VIEWBOX_WIDTH).toFixed(2);

  return { line, area: `${line} L${lastX} ${VIEWBOX_HEIGHT} L${firstX} ${VIEWBOX_HEIGHT} Z` };
}
