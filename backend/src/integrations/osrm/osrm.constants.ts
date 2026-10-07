import { MS_PER_SECOND } from '../../common/constants/time.constants';
import type { OsrmProfile } from './osrm.types';

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
export const OSRM_REQUEST_TIMEOUT_MS = 5 * MS_PER_SECOND;
export const TRAILING_SLASHES = /\/+$/;
export const COORDINATE_SEPARATOR = ',';
export const POINT_SEPARATOR = ';';
export const METERS_PER_KM = 1000;

// Response codes
export const OSRM_OK_CODE = 'Ok';
export const OSRM_NO_ROUTE_CODE = 'NoRoute';

// Messages
export const OSRM_UNAVAILABLE_MESSAGE = 'Сервис маршрутов временно недоступен, попробуйте позже';
export const OSRM_ROUTE_NOT_FOUND_MESSAGE = 'Маршрут между указанными точками не найден';
