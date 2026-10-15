import { MAP_ROUTE } from '../../config/tracking-map';

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
        strokeWidth={MAP_ROUTE.STROKE}
        strokeDasharray={MAP_ROUTE.DASH}
        strokeLinejoin="round"
      />
      <polyline
        points={passed}
        className="fill-none stroke-accent"
        strokeWidth={MAP_ROUTE.STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={pickup.x}
        cy={pickup.y}
        r={MAP_ROUTE.MARKER_RADIUS}
        className="fill-surface stroke-accent"
        strokeWidth={MAP_ROUTE.STROKE}
      />
      <circle cx={drop.x} cy={drop.y} r={MAP_ROUTE.MARKER_RADIUS} className="fill-fg" />
    </>
  );
}
