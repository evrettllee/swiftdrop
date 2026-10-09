// Sizes in the units of the viewBox.
const ROUTE_STROKE = 2;
const ROUTE_DASH = '8 8';
const MARKER_RADIUS = 6;

type MapPoint = { readonly x: number; readonly y: number };

type TrackingMapRouteProps = {
  passed: string;
  remaining: string;
  pickup: MapPoint;
  drop: MapPoint;
};

// The passed way is a solid line, the remaining one is dashed; "from" is a ring, "to" is a dot.
export function TrackingMapRoute({ passed, remaining, pickup, drop }: TrackingMapRouteProps) {
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
