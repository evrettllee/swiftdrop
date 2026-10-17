import { getRoutePreview } from '@/shared/api';
import type { GeoPoint } from '@/shared/lib/geo';
import { type MapRoute, useRouteLines } from '@/shared/lib/route-lines';

function pointKey(point: GeoPoint): string {
  return `${point.latitude},${point.longitude}`;
}

// The line between the two points along the roads, once both are set; a guest gets it too.
export function useRoutePreview(pickup: GeoPoint | null, delivery: GeoPoint | null): MapRoute {
  const canRoute = pickup !== null && delivery !== null;

  return useRouteLines(
    canRoute ? (options) => getRoutePreview({ pickup, delivery }, options) : null,
    canRoute ? `${pointKey(pickup)};${pointKey(delivery)}` : '',
  );
}
