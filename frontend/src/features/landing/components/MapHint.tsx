import { CursorIcon, HandTapIcon } from '@phosphor-icons/react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants/styles';
import { MAP_TEXTS } from '../constants/map';
import { ROUTE_POINT } from '../constants/route-points';
import type { RoutePointKind } from '../types';

const HINTS: Record<RoutePointKind, string> = {
  [ROUTE_POINT.PICKUP]: MAP_TEXTS.HINT_PICKUP,
  [ROUTE_POINT.DELIVERY]: MAP_TEXTS.HINT_DELIVERY,
};

// On a phone the hint sits in the top left corner, because the bottom right one is taken by the
// attribution; on a desktop it goes to the bottom left, as in the design.
const HINT_CLASS =
  'pointer-events-none absolute start-4 top-4 flex max-w-[calc(100%-6.5rem)] items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-caption shadow-md lg:top-auto lg:bottom-4 lg:max-w-[calc(100%-9rem)] lg:px-4 lg:py-2 lg:text-small';

// A touch screen has no cursor: the finger is shown there instead (decided by CSS, not by script).
const ICON_CLASS = 'shrink-0 text-fg-secondary';

export function MapHint({ kind }: { kind: RoutePointKind }) {
  return (
    <div className={HINT_CLASS}>
      <CursorIcon
        size={ICON_SIZE.SMALL}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className={`${ICON_CLASS} [@media(pointer:coarse)]:hidden`}
      />
      <HandTapIcon
        size={ICON_SIZE.SMALL}
        weight={ICON_WEIGHT}
        aria-hidden="true"
        className={`${ICON_CLASS} hidden [@media(pointer:coarse)]:block`}
      />
      <span>{HINTS[kind]}</span>
    </div>
  );
}
