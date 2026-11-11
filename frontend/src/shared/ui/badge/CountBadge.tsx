import { COUNT_BADGE_PLACEMENT, type CountBadgePlacement } from './count-badge-placement';

const MAX_SHOWN_COUNT = 99;

const BASE_CLASS =
  'grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-caption text-on-primary tabular-nums';

const PLACEMENT_CLASSES: Record<CountBadgePlacement, string> = {
  corner: 'pointer-events-none absolute -end-2 -top-2 border-2 border-surface leading-4',
  icon: 'pointer-events-none absolute -end-3 -top-1.5 border-2 border-surface leading-4',
  inline: 'ms-auto shrink-0 leading-5',
};

type CountBadgeProps = {
  count: number;
  placement?: CountBadgePlacement;
};

export function CountBadge({ count, placement = COUNT_BADGE_PLACEMENT.CORNER }: CountBadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <span aria-hidden="true" className={`${BASE_CLASS} ${PLACEMENT_CLASSES[placement]}`}>
      {count > MAX_SHOWN_COUNT ? `${MAX_SHOWN_COUNT}+` : count}
    </span>
  );
}
