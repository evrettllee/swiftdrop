import { WarningIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { MAP_TEXTS } from './map';

// The top left corner, as the hint of the calculator on a phone: the controls are in the top right
// one, the attribution at the bottom. The width leaves room for the column of the controls.
const BADGE_CLASS =
  'pointer-events-none absolute start-3 top-3 flex max-w-[calc(100%-5.5rem)] items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-caption shadow-md';

// A route without its line: only the points are on the map, and the line is asked for again.
export function RouteUnavailableBadge() {
  return (
    <div role="status" className={BADGE_CLASS}>
      <WarningIcon
        size={ICON_SIZE.SMALL}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className="shrink-0 text-warning"
      />
      <span>{MAP_TEXTS.ROUTE_UNAVAILABLE}</span>
    </div>
  );
}
