import { BicycleIcon } from '@phosphor-icons/react';
import type { CSSProperties } from 'react';
import { ICON_SIZE, ICON_WEIGHT } from '../../../shared/constants';
import { TRACKING } from '../constants';

// The drawing of the schematic map: coordinates are in the units of the viewBox.
const CASING_EXTRA = 2;
const ROUTE_STROKE = 2;
const ROUTE_DASH = '8 8';
const MARKER_RADIUS = 6;
const PERCENT = 100;

const DESKTOP_SIZE = { WIDTH: 640, HEIGHT: 340 } as const;

const DESKTOP_MAP = {
  VIEW_BOX: `0 0 ${DESKTOP_SIZE.WIDTH} ${DESKTOP_SIZE.HEIGHT}`,
  STREETS:
    'M-20 70H660M-20 140H660M-20 210H660M-20 280H660M90 -20V360M200 -20V360M330 -20V360M450 -20V360M560 -20V360',
  STREET_WIDTH: 10,
  AVENUE: 'M-20 320L660 20',
  AVENUE_WIDTH: 20,
  WATER: 'M-20 300C100 280 200 330 330 312S560 270 660 292V340H-20Z',
  PASSED: '200,280 200,210 330,210 330,175',
  REMAINING: '330,175 330,140 450,140 450,70',
  PICKUP: { x: 200, y: 280 },
  DROP: { x: 450, y: 70 },
  // The courier is at the end of the passed way.
  COURIER: { x: 330, y: 175 },
} as const;

const MOBILE_MAP = {
  VIEW_BOX: '0 0 340 180',
  STREETS: 'M-20 50H360M-20 120H360M70 -20V200M170 -20V200M260 -20V200',
  STREET_WIDTH: 8,
  PASSED: '70,150 70,120 170,120 170,90',
  REMAINING: '170,90 170,50 260,50',
  PICKUP: { x: 70, y: 150 },
  DROP: { x: 260, y: 50 },
} as const;

function toPercent(value: number, total: number): string {
  return `${(value / total) * PERCENT}%`;
}

// The desktop drawing sets the proportions of the block and the place of the courier tag. On a
// phone the courier is in the center of the drawing, so the tag needs no numbers there.
const DESKTOP_VARIABLES = {
  '--map-aspect': `${DESKTOP_SIZE.WIDTH} / ${DESKTOP_SIZE.HEIGHT}`,
  '--courier-x': toPercent(DESKTOP_MAP.COURIER.x, DESKTOP_SIZE.WIDTH),
  '--courier-y': toPercent(DESKTOP_MAP.COURIER.y, DESKTOP_SIZE.HEIGHT),
} as CSSProperties;

// A road: the wider line of the casing below and the road itself above it.
function Road({ d, width }: { d: string; width: number }) {
  return (
    <>
      <path d={d} className="stroke-border" strokeWidth={width + CASING_EXTRA} />
      <path d={d} className="stroke-surface-elevated" strokeWidth={width} />
    </>
  );
}

type RouteProps = {
  passed: string;
  remaining: string;
  pickup: { readonly x: number; readonly y: number };
  drop: { readonly x: number; readonly y: number };
};

// The passed way is a solid line, the remaining one is dashed; "from" is a ring, "to" is a dot.
function Route({ passed, remaining, pickup, drop }: RouteProps) {
  return (
    <>
      <polyline
        points={remaining}
        className="fill-none stroke-accent"
        strokeWidth={ROUTE_STROKE}
        strokeDasharray={ROUTE_DASH}
        strokeLinejoin="round"
      />
      <polyline
        points={passed}
        className="fill-none stroke-accent"
        strokeWidth={ROUTE_STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={pickup.x}
        cy={pickup.y}
        r={MARKER_RADIUS}
        className="fill-surface stroke-accent"
        strokeWidth={ROUTE_STROKE}
      />
      <circle cx={drop.x} cy={drop.y} r={MARKER_RADIUS} className="fill-fg" />
    </>
  );
}

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
          <Road d={DESKTOP_MAP.STREETS} width={DESKTOP_MAP.STREET_WIDTH} />
          <Road d={DESKTOP_MAP.AVENUE} width={DESKTOP_MAP.AVENUE_WIDTH} />
        </g>
        <Route
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
          <Road d={MOBILE_MAP.STREETS} width={MOBILE_MAP.STREET_WIDTH} />
        </g>
        <Route
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
