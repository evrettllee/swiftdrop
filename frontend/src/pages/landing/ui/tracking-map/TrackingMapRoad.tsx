import { ROAD_CASING_EXTRA } from '../../config/tracking-map';

type TrackingMapRoadProps = {
  d: string;
  width: number;
};

// The casing is a wider line drawn below the road, so the road has an edge in both themes.
export function TrackingMapRoad({ d, width }: TrackingMapRoadProps) {
  return (
    <>
      <path d={d} className="stroke-border" strokeWidth={width + ROAD_CASING_EXTRA} />
      <path d={d} className="stroke-surface-elevated" strokeWidth={width} />
    </>
  );
}
