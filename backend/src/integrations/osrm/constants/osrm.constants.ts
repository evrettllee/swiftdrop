import { MS_PER_MINUTE, MS_PER_SECOND } from '../../../common/constants/time.constants';
import type { OsrmProfile } from '../types/osrm.types';

// Profiles
export const OSRM_PROFILE = {
  CAR: 'car',
  BIKE: 'bike',
  FOOT: 'foot',
} as const;

// On routing.openstreetmap.de the profile is a path prefix, not part of the route path.
// A self-hosted OSRM serves one profile per instance, so only this map changes.
export const OSRM_SERVICE_PATH: Record<OsrmProfile, string> = {
  car: 'routed-car',
  bike: 'routed-bike',
  foot: 'routed-foot',
};

// Request
export const OSRM_ROUTE_PATH = 'route/v1/driving';
export const OSRM_QUERY = 'overview=false';
// The whole line of the route along the roads, for the maps.
export const OSRM_GEOMETRY_QUERY = 'overview=full&geometries=polyline6&steps=false';
export const OSRM_REQUEST_TIMEOUT_MS = 5 * MS_PER_SECOND;
export const TRAILING_SLASHES = /\/+$/;
export const COORDINATE_SEPARATOR = ',';
export const POINT_SEPARATOR = ';';
export const METERS_PER_KM = 1000;
// polyline6: a coordinate is kept in millionths of a degree.
export const POLYLINE_PRECISION = 1e6;

// Circuit breaker: after this many failures in a row the routing service is not asked for a while,
// so callers fail at once instead of waiting for a timeout each.
export const OSRM_FAILURE_THRESHOLD = 3;
export const OSRM_COOLDOWN_MS = 30 * MS_PER_SECOND;

// Route lines cache
// An open map asks for the same lines again and again; a line found is kept for a while.
export const ROUTE_GEOMETRY_CACHE_TTL_MS = 10 * MS_PER_MINUTE;
// The oldest lines are dropped beyond this many, so the memory stays bounded.
export const ROUTE_GEOMETRY_CACHE_MAX_ENTRIES = 1000;
// Points closer than about 10 m share a line: four digits after the point of a degree.
export const ROUTE_GEOMETRY_KEY_DIGITS = 4;
export const ROUTE_GEOMETRY_KEY_SEPARATOR = '|';

// Response codes
export const OSRM_OK_CODE = 'Ok';
export const OSRM_NO_ROUTE_CODE = 'NoRoute';

// Messages
export const OSRM_UNAVAILABLE_MESSAGE = 'Сервис маршрутов временно недоступен, попробуйте позже';
export const OSRM_ROUTE_NOT_FOUND_MESSAGE = 'Маршрут между указанными точками не найден';
