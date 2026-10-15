import { BicycleIcon } from '@phosphor-icons/react';
import type { CSSProperties } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '@/shared/config';
import { TRACKING } from '../../config/sections';
import { DESKTOP_MAP, DESKTOP_MAP_SIZE, MOBILE_MAP, PERCENT } from '../../config/tracking-map';
import { TrackingMapRoad } from './TrackingMapRoad';
import { TrackingMapRoute } from './TrackingMapRoute';

function toPercent(value: number, total: number): string {
  return `${(value / total) * PERCENT}%`;
}

// The desktop drawing sets the proportions of the block and the place of the courier tag. On a
// phone the courier is in the center of the drawing, so the tag needs no numbers there.
const DESKTOP_VARIABLES = {
  '--map-aspect': `${DESKTOP_MAP_SIZE.WIDTH} / ${DESKTOP_MAP_SIZE.HEIGHT}`,
  '--courier-x': toPercent(DESKTOP_MAP.COURIER.x, DESKTOP_MAP_SIZE.WIDTH),
  '--courier-y': toPercent(DESKTOP_MAP.COURIER.y, DESKTOP_MAP_SIZE.HEIGHT),
} as CSSProperties;

// An illustration of the tracking screen. It is drawn with the tokens of the design system, so it
// follows the theme. Phone and desktop get their own drawings, as in the design.
export function TrackingMap() {
  return (
    <div
      style={DESKTOP_VARIABLES}
      className="relative h-45 bg-field lg:aspect-(--map-aspect) lg:h-auto"
    >
      <svg
        viewBox={DESKTOP_MAP.VIEW_BOX}
        role="img"
        aria-label={TRACKING.MAP_LABEL}
        className="absolute inset-0 hidden size-full lg:block"
      >
        <rect width="100%" height="100%" className="fill-field" />
        <path d={DESKTOP_MAP.WATER} className="fill-map-water" />
        <g fill="none" strokeLinecap="round">
          <TrackingMapRoad d={DESKTOP_MAP.STREETS} width={DESKTOP_MAP.STREET_WIDTH} />
          <TrackingMapRoad d={DESKTOP_MAP.AVENUE} width={DESKTOP_MAP.AVENUE_WIDTH} />
        </g>
        <TrackingMapRoute
          passed={DESKTOP_MAP.PASSED}
          remaining={DESKTOP_MAP.REMAINING}
          pickup={DESKTOP_MAP.PICKUP}
          drop={DESKTOP_MAP.DROP}
        />
      </svg>
      <svg
        viewBox={MOBILE_MAP.VIEW_BOX}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={TRACKING.MAP_LABEL}
        className="absolute inset-0 size-full lg:hidden"
      >
        <rect width="100%" height="100%" className="fill-field" />
        <g fill="none" strokeLinecap="round">
          <TrackingMapRoad d={MOBILE_MAP.STREETS} width={MOBILE_MAP.STREET_WIDTH} />
        </g>
        <TrackingMapRoute
          passed={MOBILE_MAP.PASSED}
          remaining={MOBILE_MAP.REMAINING}
          pickup={MOBILE_MAP.PICKUP}
          drop={MOBILE_MAP.DROP}
        />
      </svg>
      {/* The courier sits on the route: the point is the end of the passed way in both drawings. */}
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 shadow-md lg:top-(--courier-y) lg:left-(--courier-x) lg:ps-2">
        <span
          aria-hidden="true"
          className="hidden size-8 items-center justify-center rounded-full bg-primary text-on-primary lg:flex"
        >
          <BicycleIcon size={ICON_SIZE.MEDIUM} weight={ICON_WEIGHT} />
        </span>
        <span className="text-small font-semibold tabular-nums">{TRACKING.DEMO.ARRIVAL_IN}</span>
      </div>
    </div>
  );
}
