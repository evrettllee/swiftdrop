import { CITY_CENTER, MAPBOX_API_ORIGIN } from '../../shared/constants';

const [CITY_CENTER_LATITUDE, CITY_CENTER_LONGITUDE] = CITY_CENTER;

// Mapbox Geocoding API v6: the same public token as for the map tiles.
export const GEOCODING_BASE_URL = `${MAPBOX_API_ORIGIN}/search/geocode/v6`;

export const GEOCODING_PATHS = {
  FORWARD: '/forward',
  REVERSE: '/reverse',
} as const;

// The search is limited to Belarus, to Russian names, to addresses and streets.
export const GEOCODING_PARAMS = {
  LANGUAGE: 'ru',
  COUNTRY: 'by',
  TYPES: 'address,street',
  LIMIT: 5,
  // Results near the city center go first; Mapbox expects longitude,latitude.
  PROXIMITY: `${CITY_CENTER_LONGITUDE},${CITY_CENTER_LATITUDE}`,
  // Suggestions come only from the area around Minsk, where the courier service works:
  // west,south,east,north. The exact check of the service zone is done by the backend.
  BBOX: '27.3,53.75,27.85,54.05',
} as const;

// Shorter queries are not sent at all: they match too many places.
export const GEOCODING_MIN_QUERY_LENGTH = 3;
// The request goes out when the user has stopped typing for this long.
export const GEOCODING_DEBOUNCE_MS = 300;

// A cancelled request is not an error: the caller has already asked for something newer.
export const ABORT_ERROR_NAME = 'AbortError';

export const GEOCODING_ERROR_MESSAGES = {
  NETWORK: 'Нет соединения. Проверьте интернет и повторите попытку',
  UNAVAILABLE: 'Поиск адресов временно недоступен. Укажите точку на карте',
} as const;

export const SEARCH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
} as const;

// Address field
export const ADDRESS_FIELD_KEY = {
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ENTER: 'Enter',
} as const;

export const NO_ACTIVE_INDEX = -1;

export const ADDRESS_FIELD_TEXTS = {
  NO_RESULTS: 'Ничего не найдено. Уточните адрес или отметьте точку на карте',
} as const;
