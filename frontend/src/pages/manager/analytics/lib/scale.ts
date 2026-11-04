const NICE_STEPS = [1, 2, 5, 10] as const;
const PRECISION = 12;
const DECIMAL_BASE = 10;

export type Scale = { top: number; ticks: number[] };

function niceStep(raw: number): number {
  const power = DECIMAL_BASE ** Math.floor(Math.log10(raw));
  const step = NICE_STEPS.map((multiplier) => multiplier * power).find(
    (candidate) => candidate >= raw,
  );

  return Number((step ?? raw).toPrecision(PRECISION));
}

export function niceScale(max: number, intervals: number): Scale {
  const step = max > 0 ? niceStep(max / intervals) : 1;
  const ticks = Array.from({ length: intervals + 1 }, (_, index) =>
    Number((index * step).toPrecision(PRECISION)),
  );

  return { top: ticks[intervals], ticks };
}

export function labelStep(count: number, maxLabels: number): number {
  return Math.max(1, Math.ceil(count / maxLabels));
}

export function barShare(value: number, top: number): number {
  return top === 0 ? 0 : Math.min(1, value / top);
}
