import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import type { GeoPoint } from '@/common/schemas/geo-point.schema';
import { GEOJSON_POLYGON_TYPE } from '../constants/zones.constants';
import type { ServiceZoneMatch, ZoneCandidate } from '../types/zones.types';

// Higher priority wins; equal priorities fall back to the older zone so the result is stable.
function compareZones(first: ZoneCandidate, second: ZoneCandidate): number {
  return second.priority - first.priority || first.zoneId - second.zoneId;
}

export function selectZoneForPoint(
  zones: ZoneCandidate[],
  point: GeoPoint,
): ServiceZoneMatch | null {
  // GeoJSON order is [longitude, latitude].
  const position = [point.longitude, point.latitude];

  const [best] = zones
    .filter((zone) =>
      booleanPointInPolygon(position, {
        type: GEOJSON_POLYGON_TYPE,
        coordinates: zone.polygon,
      }),
    )
    .sort(compareZones);

  return best ? { zoneId: best.zoneId, name: best.name, tariffId: best.tariffId } : null;
}
