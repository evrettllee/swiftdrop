// Geometry
export const GEOJSON_POLYGON_TYPE = 'Polygon' as const;

export const ZONE_POLYGON_LIMITS = {
  MIN_VERTICES: 3,
  MAX_VERTICES: 200,
  MIN_AREA_KM2: 0.01,
  DECIMALS: 6,
  MAX_LATITUDE: 90,
  MAX_LONGITUDE: 180,
} as const;

export const KM_PER_DEGREE_LATITUDE = 110.574;
export const KM_PER_DEGREE_LONGITUDE_AT_EQUATOR = 111.32;

export const ZONE_POLYGON_ERROR = {
  TOO_FEW_POINTS: 'too_few_points',
  TOO_MANY_POINTS: 'too_many_points',
  SELF_INTERSECTION: 'self_intersection',
  TOO_SMALL: 'too_small',
  OUT_OF_RANGE: 'out_of_range',
} as const;
