import { useState } from 'react';
import { COLOR_TRANSITION_CLASS } from '@/shared/config';
import {
  barShare,
  gridStyle,
  labelStep,
  niceScale,
  percentHeight,
  tooltipAlignFor,
} from './chart-helpers';
import { ChartFigure, ChartTooltip } from './ChartPrimitives';

const INTERVALS = 4;
const DESKTOP_LABELS_MAX = 8;
const PHONE_LABELS_MAX = 6;

export type VerticalBarDatum = {
  key: string;
  xLabel: string;
  value: number;
  tooltipTitle: string;
  tooltipSubtitle?: string;
};

type VerticalBarChartProps = {
  items: readonly VerticalBarDatum[];
  ariaLabel: string;
  isDesktop: boolean;
};

export function VerticalBarChart({ items, ariaLabel, isDesktop }: VerticalBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const maxValue = items.reduce((max, item) => Math.max(max, item.value), 0);
  const scale = niceScale(maxValue, INTERVALS);
  const step = labelStep(items.length, isDesktop ? DESKTOP_LABELS_MAX : PHONE_LABELS_MAX);

  return (
    <ChartFigure
      label={ariaLabel}
      ticks={scale.ticks}
      xLabels={items.map((item) => item.xLabel)}
      xStep={step}
    >
      <div
        aria-hidden="true"
        style={gridStyle(INTERVALS)}
        className="relative flex h-60 items-end gap-1.5 border-b border-border lg:gap-3"
      >
        {items.map((item, index) => {
          const share = barShare(item.value, scale.top);
          const isActive = activeIndex === index;

          return (
            <div
              key={item.key}
              className="relative flex h-full min-w-0 flex-1 items-end justify-center"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex((current) => (current === index ? null : current))}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex((current) => (current === index ? null : current))}
            >
              <button
                type="button"
                tabIndex={0}
                aria-label={`${item.tooltipTitle}${item.tooltipSubtitle ? `, ${item.tooltipSubtitle}` : ''}`}
                style={{ height: percentHeight(share) }}
                className={`w-full max-w-6 rounded-t-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${COLOR_TRANSITION_CLASS} ${
                  isActive ? 'bg-primary' : 'bg-accent'
                }`}
              />
              {isActive ? (
                <ChartTooltip
                  title={item.tooltipTitle}
                  subtitle={item.tooltipSubtitle}
                  align={tooltipAlignFor(index, items.length)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </ChartFigure>
  );
}
