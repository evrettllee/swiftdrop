import type { ZONE_POLYGON_ERROR } from '../constants/zones.constants';

export type ServiceZoneMatch = {
  zoneId: number;
  name: string;
  tariffId: number;
};

export type ZoneCandidate = ServiceZoneMatch & {
  priority: number;
  // GeoJSON polygon: list of rings, each ring is a list of [longitude, latitude] points.
  polygon: number[][][];
};

export type ZonePolygonError = (typeof ZONE_POLYGON_ERROR)[keyof typeof ZONE_POLYGON_ERROR];

export type ZonePolygonCheck =
  | { ok: true; polygon: number[][][]; vertexCount: number; areaKm2: number }
  | { ok: false; reason: ZonePolygonError };
