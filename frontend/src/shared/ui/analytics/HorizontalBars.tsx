import { formatWhole } from '@/shared/lib/format';

export type HorizontalBarItem = {
  key: string;
  label: string;
  count: number;
  sharePct: number;
  barWidthPct: number;
};

type HorizontalBarsProps = {
  items: readonly HorizontalBarItem[];
  trackSize?: 'lg' | 'sm';
};

export function HorizontalBars({ items, trackSize = 'sm' }: HorizontalBarsProps) {
  const heightClass = trackSize === 'lg' ? 'h-6' : 'h-3';

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div
          key={item.key}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 lg:grid-cols-[10.5rem_minmax(0,1fr)_7rem] lg:gap-4"
        >
          <span className="text-small text-fg">{item.label}</span>
          <span
            className={`col-span-full row-start-2 block w-full overflow-hidden rounded-r-sm bg-field lg:col-span-1 lg:row-start-auto ${heightClass}`}
          >
            <span
              className="block h-full rounded-r-sm bg-accent"
              style={{ width: `${item.barWidthPct}%` }}
            />
          </span>
          <span className="text-end text-small tabular-nums">
            <b className="font-semibold text-fg">{formatWhole(item.count)}</b>{' '}
            <span className="text-fg-secondary">{`${item.sharePct}%`}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
